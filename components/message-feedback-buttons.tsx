"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, Copy, RefreshCw, Check } from "lucide-react"
import { toast } from "sonner"

interface MessageFeedbackButtonsProps {
  messageId: string
  messageContent: string
  sessionId: string
  onRetry?: () => void
}

export function MessageFeedbackButtons({ messageId, messageContent, sessionId, onRetry }: MessageFeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleLike = async () => {
    if (isSubmittingFeedback) return

    setIsSubmittingFeedback(true)
    try {
      await fetch("/api/message-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: "like",
          session_id: sessionId,
        }),
      })
      setFeedback("like")
      toast.success("피드백이 전송되었습니다")
    } catch (error) {
      console.error("Like feedback error:", error)
      toast.error("피드백 전송에 실패했습니다")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const handleDislike = async () => {
    if (isSubmittingFeedback) return

    setIsSubmittingFeedback(true)
    try {
      await fetch("/api/message-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: "dislike",
          session_id: sessionId,
        }),
      })
      setFeedback("dislike")
      toast.success("피드백이 전송되었습니다")
    } catch (error) {
      console.error("Dislike feedback error:", error)
      toast.error("피드백 전송에 실패했습니다")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent)
      setCopied(true)
      toast.success("메시지가 복사되었습니다")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Copy failed:", error)
      toast.error("복사에 실패했습니다")
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isSubmittingFeedback}
        className={`p-1.5 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 ${
          feedback === "like" ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20" : ""
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>

      {/* Dislike Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDislike}
        disabled={isSubmittingFeedback}
        className={`p-1.5 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 ${
          feedback === "dislike" ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20" : ""
        }`}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>

      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="p-1.5 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
      >
        {copied ? <Check className="h-3 w-3 text-green-600 dark:text-green-400" /> : <Copy className="h-3 w-3" />}
      </Button>

      {/* Retry Button */}
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="p-1.5 h-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
