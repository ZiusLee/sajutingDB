"use client"

import { useAuth } from "@/contexts/auth-context"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { MemoryDebugPanel } from "@/components/memory-debug-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Brain, Settings, BarChart3, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function MemoryDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6" />
              로그인 필요
            </CardTitle>
            <CardDescription>메모리 대시보드를 사용하려면 로그인이 필요합니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/auth")}>로그인하기</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>

            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8" />
              스마트 메모리 대시보드
            </h1>
            <p className="text-gray-600 mt-2">AI가 기억하는 당신에 대한 정보를 관리하고 확인하세요.</p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                대시보드
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                디버그
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                설정
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <MemoryDashboard userId={user.id} />
            </TabsContent>

            <TabsContent value="debug" className="space-y-6">
              <MemoryDebugPanel userId={user.id} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>메모리 설정</CardTitle>
                  <CardDescription>스마트 메모리 기능의 동작을 설정합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">스마트 메모리 활성화</h4>
                        <p className="text-sm text-gray-600">AI가 대화 내용을 기억하도록 허용합니다.</p>
                      </div>
                      <div className="text-sm text-green-600 font-medium">활성화됨</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">메모리 자동 정리</h4>
                        <p className="text-sm text-gray-600">오래된 메모리를 자동으로 정리합니다.</p>
                      </div>
                      <div className="text-sm text-gray-500">1000개 유지</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
