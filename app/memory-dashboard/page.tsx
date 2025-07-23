import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { MemoryDebugPanel } from "@/components/memory-debug-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Settings, BarChart3 } from "lucide-react"

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth")
  }

  return user
}

export default async function MemoryDashboardPage() {
  const user = await getUser()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
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
            <Suspense
              fallback={
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <MemoryDashboard userId={user.id} />
            </Suspense>
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
                    <div className="text-sm text-gray-500">현재 활성화됨</div>
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
  )
}
