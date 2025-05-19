"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BirthDateFormClient from "@/components/birth-date-form-client"
import { getSupabase } from "@/lib/supabase-client"

export default function Home() {
  const router = useRouter()
  const supabase = getSupabase()

  // 인증된 사용자를 마이페이지로 리다이렉션 (관리자 페이지 제외)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        // 현재 경로가 관리자 페이지인 경우 리다이렉트하지 않음
        const pathname = window.location.pathname
        if (pathname === "/") {
          console.log("User is authenticated, redirecting to mypage")
          router.push("/mypage")
        }
      }
    }

    checkAuthAndRedirect()
  }, [router, supabase.auth])

  // 메인 페이지에 패딩 추가
  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">사주핑 리포트</CardTitle>
        </CardHeader>
        <CardContent>
          <BirthDateFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
