"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { debugAuthState } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"

export function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const handleDebug = async () => {
    setIsLoading(true)
    try {
      const info = await debugAuthState()
      setDebugInfo(info)
    } catch (error) {
      console.error("Debug error:", error)
      setDebugInfo({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  const testSmartMemoryAPI = async () => {
    try {
      console.log("🧪 Testing Smart Memory API...")

      // GET 테스트
      const getResponse = await fetch("/api/smart-memory")
      const getResult = await getResponse.json()
      console.log("GET /api/smart-memory:", {
        status: getResponse.status,
        result: getResult,
      })

      // POST 테스트 (인증된 경우에만)
      if (getResponse.status === 200) {
        const postResponse = await fetch("/api/smart-memory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `테스트 메모리 - ${new Date().toISOString()}`,
            type: "test",
            keywords: ["test", "debug"],
            importance: 1,
            is_pinned: false,
          }),
        })
        const postResult = await postResponse.json()
        console.log("POST /api/smart-memory:", {
          status: postResponse.status,
          result: postResult,
        })
      }
    } catch (error) {
      console.error("API Test Error:", error)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>인증 상태 디버그 패널</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleDebug} disabled={isLoading}>
            {isLoading ? "디버깅 중..." : "인증 상태 확인"}
          </Button>
          <Button onClick={testSmartMemoryAPI} variant="outline">
            Smart Memory API 테스트
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Auth Context</h4>
            <div className="space-y-1 text-sm">
              <div>
                인증됨:{" "}
                <Badge variant={isAuthenticated ? "default" : "destructive"}>{isAuthenticated ? "예" : "아니오"}</Badge>
              </div>
              <div>
                로딩 중: <Badge variant={authLoading ? "secondary" : "outline"}>{authLoading ? "예" : "아니오"}</Badge>
              </div>
              <div>사용자 ID: {user?.id || "없음"}</div>
              <div>이메일: {user?.email || "없음"}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">브라우저 정보</h4>
            <div className="space-y-1 text-sm">
              <div>현재 URL: {typeof window !== "undefined" ? window.location.href : "서버"}</div>
              <div>쿠키 개수: {typeof document !== "undefined" ? document.cookie.split(";").length : "알 수 없음"}</div>
              <div>
                Supabase 쿠키:{" "}
                <Badge
                  variant={
                    typeof document !== "undefined" && document.cookie.includes("sb-") ? "default" : "destructive"
                  }
                >
                  {typeof document !== "undefined" && document.cookie.includes("sb-") ? "있음" : "없음"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {debugInfo && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">디버그 정보</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>💡 브라우저 콘솔을 확인하여 추가 로그를 확인하세요.</p>
          <p>🔧 Production 환경에서는 이 패널을 제거해야 합니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
