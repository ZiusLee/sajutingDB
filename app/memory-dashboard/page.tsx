"use client"
import { useAuth } from "@/hooks/use-auth"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MemoryDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6" />
              로그인 필요
            </CardTitle>
            <CardDescription>메모리 대시보드를 사용하려면 로그인이 필요합니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/login")}>로그인하기</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      <MemoryDashboard userId={user.id} />
    </div>
  )
}
