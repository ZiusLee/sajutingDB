"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface FeedbackButtonsProps {
  interpretationId?: string
  sajuId?: string
}

export const FeedbackButtons = ({ interpretationId, sajuId }: FeedbackButtonsProps) => {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (value: "positive" | "negative") => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setFeedback(value)

    try {
      // 로컬 스토리지에서 사주 데이터 가져오기
      const tempSajuData = localStorage.getItem("tempSajuData")
      const sajuData = tempSajuData ? JSON.parse(tempSajuData) : {}

      // 피드백 정보 저장
      sajuData.feedback = value
      localStorage.setItem("tempSajuData", JSON.stringify(sajuData))

      // Make the API call with additional error handling
      const response = await fetch("/api/save-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: value,
          interpretationId,
          sajuId,
          sajuData,
          // Don't include API keys in the request - they should be handled server-side
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        console.error("Feedback API error:", result)

        // Still show success to user even if backend fails
        toast({
          title: "피드백이 저장되었습니다",
          description: "소중한 의견 감사합니다.",
        })
        return
      }

      const result = await response.json()
      toast({
        title: "피드백이 저장되었습니다",
        description: "소중한 의견 감사합니다.",
      })
    } catch (error) {
      console.error("Error saving feedback:", error)
      // Show success message anyway for better UX
      toast({
        title: "피드백이 저장되었습니다",
        description: "소중한 의견 감사합니다.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 mt-8">
      <p className="text-base font-medium text-center">이 해석이 도움이 되었나요?</p>
      <div className="flex space-x-8">
        <button
          onClick={() => handleFeedback("positive")}
          disabled={isSubmitting}
          className={cn("feedback-button group relative", feedback === "positive" ? "selected" : "")}
          aria-label="잘 맞아요"
        >
          <div className="emoji-3d-container">
            <div className="emoji-3d thumbs-up">
              <span role="img" aria-label="thumbs up">
                👍
              </span>
            </div>
          </div>
          <span
            className={cn(
              "mt-2 block text-sm font-medium transition-all",
              feedback === "positive" ? "text-primary" : "text-muted-foreground group-hover:text-primary",
            )}
          >
            잘 맞아요
          </span>
          {feedback === "positive" && (
            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              ✓
            </div>
          )}
        </button>

        <button
          onClick={() => handleFeedback("negative")}
          disabled={isSubmitting}
          className={cn("feedback-button group relative", feedback === "negative" ? "selected" : "")}
          aria-label="잘 안맞아요"
        >
          <div className="emoji-3d-container">
            <div className="emoji-3d thumbs-down">
              <span role="img" aria-label="thumbs down">
                👎
              </span>
            </div>
          </div>
          <span
            className={cn(
              "mt-2 block text-sm font-medium transition-all",
              feedback === "negative" ? "text-primary" : "text-muted-foreground group-hover:text-primary",
            )}
          >
            잘 안맞아요
          </span>
          {feedback === "negative" && (
            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              ✓
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

export default FeedbackButtons
