"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Copy, RefreshCw, Check } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MessageFeedback {
  id: string
  message_id: string
  feedback_type: "like" | "dislike" | "copy" | "regenerate"
  session_id?: string
  created_at: Date
  selected_text?: string
  selection_start?: number
  selection_end?: number
  feedback_text?: string
  metadata?: Record<string, any>
}

interface MessageFeedbackButtonsProps {
  messageId: string
  messageContent: string
  sessionId: string
  onRetry?: () => void
  className?: string
}

export function MessageFeedbackButtons({
  messageId,
  messageContent,
  sessionId,
  onRetry,
  className = "",
}: MessageFeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<{
    liked: boolean
    disliked: boolean
    copied: boolean
    regenerated: boolean
  }>({
    liked: false,
    disliked: false,
    copied: false,
    regenerated: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDislikeDialog, setShowDislikeDialog] = useState(false)
  const [dislikeFeedback, setDislikeFeedback] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [selectedText, setSelectedText] = useState("")
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 텍스트 선택 감지
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString()
      const range = selection.getRangeAt(0)

      // 메시지 컨테이너 내에서의 선택인지 확인
      if (containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedText(selectedText)
        setSelectionRange({
          start: range.startOffset,
          end: range.endOffset,
        })
      }
    }
  }, [])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    setDragStartX(clientX)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const deltaX = clientX - dragStartX

    // 오른쪽으로 드래그하면 좋아요
    if (deltaX > 50) {
      handleFeedback("like")
      setIsDragging(false)
    }
    // 왼쪽으로 드래그하면 싫어요
    else if (deltaX < -50) {
      setShowDislikeDialog(true)
      setIsDragging(false)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleFeedback = async (feedbackType: "like" | "dislike" | "copy" | "regenerate") => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Handle copy action locally first
      if (feedbackType === "copy") {
        const textToCopy = selectedText || messageContent
        await navigator.clipboard.writeText(textToCopy)
        setFeedback((prev) => ({ ...prev, copied: true }))
        toast.success(selectedText ? "선택된 텍스트가 복사되었습니다" : "메시지가 클립보드에 복사되었습니다")

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setFeedback((prev) => ({ ...prev, copied: false }))
        }, 2000)
      }

      // Handle regenerate action locally first
      if (feedbackType === "regenerate") {
        setFeedback((prev) => ({ ...prev, regenerated: true }))
        if (onRetry) {
          onRetry()
        }
        toast.success("메시지를 다시 생성합니다")
      }

      // Handle like/dislike toggle locally first
      if (feedbackType === "like" || feedbackType === "dislike") {
        const newState = !feedback[feedbackType === "like" ? "liked" : "disliked"]

        setFeedback((prev) => ({
          ...prev,
          liked: feedbackType === "like" ? newState : false,
          disliked: feedbackType === "dislike" ? newState : false,
        }))

        if (newState) {
          toast.success(feedbackType === "like" ? "좋아요!" : "피드백 감사합니다")
        }
      }

      // Prepare feedback data
      const feedbackData: Partial<MessageFeedback> = {
        message_id: messageId,
        feedback_type: feedbackType,
        session_id: sessionId,
      }

      // Add selection data if text was selected
      if (selectedText && selectionRange) {
        feedbackData.selected_text = selectedText
        feedbackData.selection_start = selectionRange.start
        feedbackData.selection_end = selectionRange.end
      }

      console.log("Sending feedback:", feedbackData)

      // Save feedback to database
      const response = await fetch("/api/message-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save feedback")
      }

      console.log("Feedback saved:", result)

      // If the feedback was skipped (message not in DB yet), that's okay
      if (result.skipped) {
        console.log("Feedback skipped:", result.message)
      }

      // Clear selection after feedback
      setSelectedText("")
      setSelectionRange(null)
      window.getSelection()?.removeAllRanges()
    } catch (error) {
      console.error("Error handling feedback:", error)
      toast.error("피드백 저장 중 오류가 발생했습니다")

      // Revert state on error for like/dislike
      if (feedbackType === "like" || feedbackType === "dislike") {
        setFeedback((prev) => ({
          ...prev,
          liked: false,
          disliked: false,
        }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDislikeFeedback = async () => {
    try {
      setIsSubmitting(true)

      const feedbackData: Partial<MessageFeedback> = {
        message_id: messageId,
        feedback_type: "dislike",
        session_id: sessionId,
        feedback_text: dislikeFeedback.trim() || undefined,
      }

      // Add selection data if text was selected
      if (selectedText && selectionRange) {
        feedbackData.selected_text = selectedText
        feedbackData.selection_start = selectionRange.start
        feedbackData.selection_end = selectionRange.end
      }

      const response = await fetch("/api/message-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save detailed feedback")
      }

      setFeedback((prev) => ({ ...prev, disliked: true }))
      setShowDislikeDialog(false)
      setDislikeFeedback("")
      setSelectedText("")
      setSelectionRange(null)
      window.getSelection()?.removeAllRanges()
      toast.success("피드백이 저장되었습니다")
    } catch (error) {
      console.error("Error saving dislike feedback:", error)
      toast.error("피드백 저장 중 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`group flex items-center space-x-1 ${className} select-none`}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseUpCapture={handleTextSelection}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          transform: isDragging ? "scale(1.02)" : "scale(1)",
          transition: isDragging ? "none" : "transform 0.2s ease",
        }}
      >
        {selectedText && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2 dark:bg-blue-900/30 dark:text-blue-400">
            선택됨: "{selectedText.slice(0, 20)}..."
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback("like")}
          disabled={isSubmitting}
          className={`p-1.5 h-7 w-7 rounded-md transition-colors ${
            feedback.liked
              ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          }`}
          title="좋아요 (오른쪽으로 드래그)"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDislikeDialog(true)}
          disabled={isSubmitting}
          className={`p-1.5 h-7 w-7 rounded-md transition-colors ${
            feedback.disliked
              ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          }`}
          title="별로예요 (왼쪽으로 드래그)"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback("copy")}
          disabled={isSubmitting}
          className={`p-1.5 h-7 w-7 rounded-md transition-colors ${
            feedback.copied
              ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          }`}
          title={selectedText ? "선택된 텍스트 복사" : "전체 메시지 복사"}
        >
          {feedback.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>

        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback("regenerate")}
            disabled={isSubmitting || feedback.regenerated}
            className={`p-1.5 h-7 w-7 rounded-md transition-colors ${
              feedback.regenerated
                ? "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            }`}
            title="다시 생성"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Dislike 피드백 다이얼로그 */}
      <Dialog open={showDislikeDialog} onOpenChange={setShowDislikeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>피드백을 남겨주세요</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedText && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Label className="text-sm font-medium">선택된 텍스트:</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"{selectedText}"</p>
              </div>
            )}
            <div>
              <Label htmlFor="feedback">어떤 부분이 아쉬웠나요? (선택사항)</Label>
              <Textarea
                id="feedback"
                placeholder="개선할 점이나 문제점을 알려주세요..."
                value={dislikeFeedback}
                onChange={(e) => setDislikeFeedback(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDislikeDialog(false)}>
                취소
              </Button>
              <Button
                onClick={handleDislikeFeedback}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? "저장 중..." : "피드백 보내기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
