"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { getSupabase } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"

interface ManualDataLinkProps {
  onSuccess?: () => void
}

export default function ManualDataLink({ onSuccess }: ManualDataLinkProps) {
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = getSupabase()

  const handleLink = async () => {
    if (!sessionId.trim()) {
      toast({
        title: "세션 ID 필요",
        description: "연결할 세션 ID�� 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get current auth user
      const { data: userData } = await supabase.auth.getUser()
      const authUserId = userData?.user?.id

      if (!authUserId) {
        toast({
          title: "인증 오류",
          description: "로그인된 사용자를 찾을 수 없습니다.",
          variant: "destructive",
        })
        return
      }

      // Update the session with the auth user ID
      const { error } = await supabase.from("saju_sessions").update({ auth_user_id: authUserId }).eq("id", sessionId)

      if (error) {
        console.error("Error linking session:", error)
        toast({
          title: "연결 실패",
          description: `세션 연결 중 오류가 발생했습니다: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "연결 성공",
        description: "세션이 성공적으로 연결되었습니다.",
      })

      // Clear input
      setSessionId("")

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error in manual link:", error)
      toast({
        title: "연결 실패",
        description: `세션 연결 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>세션 수동 연결</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            기존 사주 프로필의 세션 ID를 입력하여 현재 계정에 연결할 수 있습니다.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="세션 ID 입력"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleLink} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              연결
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
