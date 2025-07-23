"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function MemoryDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && !user && isClient) {
      console.log("🔄 [MemoryDashboard] 사용자 미인증, /auth로 리다이렉트")
      router.push("/auth")
    }
  }, [user, loading, router, isClient])

  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              로딩 중...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">메모리 대시보드를 준비하고 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>인증 필요</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">로그인이 필요한 페이지입니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">스마트 메모리 대시보드</h1>
        <p className="text-muted-foreground mt-2">AI가 기억하는 당신에 대한 정보를 확인하고 관리하세요.</p>
      </div>

      <MemoryDashboard userId={user.id} />
    </div>
  )
}
