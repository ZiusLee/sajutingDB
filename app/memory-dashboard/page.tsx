import { auth } from "@clerk/nextjs"
import { redirect } from "next/navigation"

import { MemoryDashboard } from "@/components/memory-dashboard"
import { Badge } from "@/components/ui/badge"
// MemoryDebugPanel import 추가
import { MemoryDebugPanel } from "@/components/memory-debug-panel"

const MemoryDashboardPage = async () => {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🧠 스마트 메모리 대시보드</h1>
        <Badge variant="outline">{user?.email}</Badge>
      </div>

      {/* 디버그 패널 추가 */}
      <MemoryDebugPanel userId={user?.id} />

      <MemoryDashboard userId={user?.id} />
    </div>
  )
}

export default MemoryDashboardPage

async function currentUser() {
  const { userId } = auth()

  if (!userId) {
    return null
  }

  // This is a placeholder. Replace with your actual user fetching logic.
  // For example, you might fetch the user from your database.
  return {
    id: userId,
    email: userId + "@example.com", // Replace with actual email
  }
}
