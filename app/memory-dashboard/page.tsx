import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { MemoryDebugPanel } from "@/components/memory-debug-panel"

export default async function MemoryDashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth")
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🧠 스마트 메모리 대시보드</h1>
        <p className="text-gray-600">AI가 기억하는 당신에 대한 정보를 관리하세요</p>
      </div>

      {/* 디버그 패널 */}
      <MemoryDebugPanel userId={session.user.id} />

      {/* 메모리 대시보드 */}
      <MemoryDashboard userId={session.user.id} />
    </div>
  )
}
