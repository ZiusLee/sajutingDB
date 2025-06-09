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
    retried: boolean
  }>({
    liked: false,
    disliked: false,
    copied: false,
    retried: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (feedbackType: "like" | "dislike" | "copy" | "retry") => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Handle copy action
      if (feedbackType === "copy") {
        await navigator.clipboard.writeText(messageContent)
        setFeedback((prev) => ({ ...prev, copied: true }))
        toast.success("메시지가 클립보드에 복사되었습니다")

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setFeedback((prev) => ({ ...prev, copied: false }))
        }, 2000)
      }

      // Handle retry action
      if (feedbackType === "retry") {
        setFeedback((prev) => ({ ...prev, retried: true }))
        if (onRetry) {
          onRetry()
        }
        toast.success("메시지를 다시 생성합니다")
      }

      // Handle like/dislike toggle
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

      // Save feedback to database (always save, even for copy/retry)
      const response = await fetch("/api/message-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          feedbackType,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save feedback")
      }
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

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
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
        title="좋아요"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback("dislike")}
        disabled={isSubmitting}
        className={`p-1.5 h-7 w-7 rounded-md transition-colors ${
          feedback.disliked
            ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        }`}
        title="별로예요"
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
        title="복사"
      >
        {feedback.copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>

      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback("retry")}
          disabled={isSubmitting || feedback.retried}
          className={`p-1.5 h-7 w-7 rounded-md transition-colors ${
            feedback.retried
              ? "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          }`}
          title="다시 생성"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
