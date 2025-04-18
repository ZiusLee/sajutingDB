"use client"

import { useRouter } from "next/navigation"
import { Mail, MessageSquare, Facebook, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <div className="flex justify-end p-4">
        <button onClick={() => router.push("/")} className="p-2" aria-label="닫기">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 로고 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-12">
          <span className="text-3xl font-bold text-gray-800">사주팅</span>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* 카카오 로그인 */}
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
            onClick={() => console.log("카카오 로그인")}
          >
            <MessageSquare className="h-5 w-5" />
            <span>카카오톡으로 로그인</span>
          </Button>

          {/* 이메일 로그인 */}
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 border-gray-300"
            onClick={() => router.push("/login")}
          >
            <Mail className="h-5 w-5" />
            <span>이메일로 로그인</span>
          </Button>

          {/* 이메일 가입 */}
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 border-gray-300"
            onClick={() => router.push("/register")}
          >
            <Mail className="h-5 w-5" />
            <span>이메일로 가입</span>
          </Button>

          {/* 페이스북 로그인 */}
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            onClick={() => console.log("페이스북 로그인")}
          >
            <Facebook className="h-5 w-5" />
            <span>페이스북으로 로그인</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
