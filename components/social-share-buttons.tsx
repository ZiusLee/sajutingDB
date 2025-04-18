"use client"

import { Button } from "@/components/ui/button"
import { Share, Twitter, Facebook, Link2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface SocialShareButtonsProps {
  title?: string
  url?: string
}

export default function SocialShareButtons({
  title = "내 사주팔자 결과를 확인해보세요!",
  url,
}: SocialShareButtonsProps) {
  // 현재 URL 가져오기
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "")

  // 트위터 공유
  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`
    window.open(twitterUrl, "_blank")
  }

  // 페이스북 공유
  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`
    window.open(facebookUrl, "_blank")
  }

  // 링크 복사
  const copyLink = () => {
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        toast({
          title: "링크가 복사되었습니다",
          description: "원하는 곳에 붙여넣기 하세요.",
        })
      })
      .catch((err) => {
        console.error("링크 복사 실패:", err)
        toast({
          title: "링크 복사 실패",
          description: "링크를 복사하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        <Share className="h-4 w-4" />
        결과 공유하기
      </p>
      <div className="flex space-x-2">
        <Button
          onClick={shareOnTwitter}
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors"
          aria-label="트위터에 공유하기"
        >
          <Twitter className="h-5 w-5" />
        </Button>
        <Button
          onClick={shareOnFacebook}
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
          aria-label="페이스북에 공유하기"
        >
          <Facebook className="h-5 w-5" />
        </Button>
        <Button
          onClick={copyLink}
          variant="outline"
          size="icon"
          className="rounded-full hover:bg-gray-100 transition-colors"
          aria-label="링크 복사하기"
        >
          <Link2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
