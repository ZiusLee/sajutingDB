"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { MemoryDebugPanel } from "@/components/memory-debug-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function MemoryDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        router.push("/auth")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">스마트 메모리 대시보드</h1>
        <p className="text-muted-foreground mt-2">AI가 기억하는 당신에 대한 정보를 관리하세요</p>
      </div>

      <Tabs defaultValue="memories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="memories">메모리 목록</TabsTrigger>
          <TabsTrigger value="debug">디버그</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

        <TabsContent value="memories">
          <MemoryDashboard userId={user.id} />
        </TabsContent>

        <TabsContent value="debug">
          <MemoryDebugPanel userId={user.id} />
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>메모리 통계</CardTitle>
              <CardDescription>AI가 학습한 정보의 통계를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">통계 기능은 곧 추가될 예정입니다.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
