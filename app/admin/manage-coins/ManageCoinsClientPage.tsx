"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminCoinManager from "@/components/admin-coin-manager"
import { getSupabase } from "@/lib/supabase-client"
import { isAdmin } from "@/lib/admin-utils"

export default function ManageCoinsClientPage() {
  const router = useRouter()
  const supabase = getSupabase()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setLoading(true)
        // 현재 로그인한 사용자 확인
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          // 로그인되지 않은 경우 홈페이지로 리다이렉트
          router.push("/")
          return
        }

        // 관리자 권한 확인
        const adminCheck = await isAdmin(data.session.user.id)
        if (!adminCheck) {
          // 관리자가 아닌 경우 접근 거부 메시지 표시
          setIsAuthorized(false)
        } else {
          setIsAuthorized(true)
        }
      } catch (error) {
        console.error("관리자 권한 확인 오류:", error)
        setIsAuthorized(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">권한을 확인하는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">접근 거부!</strong>
          <span className="block sm:inline"> 이 페이지에 접근할 권한이 없습니다.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">관리자 코인 관리</h1>
      <AdminCoinManager />
    </div>
  )
}
