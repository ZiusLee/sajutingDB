"use client"

import { useAuth } from "@/contexts/auth-context"
import { MemoryDashboard } from "@/components/memory-dashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function MemoryDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">스마트 메모리 대시보드</h1>
      <MemoryDashboard userId={user.id} />
    </div>
  )
}
