"use client"

import type React from "react"

import { useState } from "react"

export default function AccountDeletionPage() {
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, reason }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage("계정 삭제 요청이 성공적으로 처리되었습니다.")
        setEmail("")
        setReason("")
      } else {
        setIsSuccess(false)
        setMessage(data.error || "오류가 발생했습니다.")
      }
    } catch (error) {
      setIsSuccess(false)
      setMessage("네트워크 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full bg-white scroll-smooth overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">계정 삭제 요청</h1>
            <p className="text-gray-600">사주핑(SajuPing) 앱에서 계정을 삭제하는 방법을 안내해드립니다.</p>
          </div>

          <hr className="border-gray-200" />

          {/* 계정 삭제 단계 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">계정 삭제 요청 단계</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">아래 양식 작성</h3>
                  <p className="text-gray-600">계정에 등록된 이메일 주소를 입력하고 삭제 사유를 작성해주세요.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">삭제 요청 제출</h3>
                  <p className="text-gray-600">'계정 삭제 요청' 버튼을 클릭하여 요청을 제출합니다.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">즉시 처리</h3>
                  <p className="text-gray-600">요청이 확인되면 계정과 관련 데이터가 즉시 삭제됩니다.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 삭제되는 데이터 정보 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">삭제되는 데이터 유형</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-red-600">완전 삭제되는 데이터</h3>
                <ul className="space-y-2 text-sm">
                  <li>• 계정 정보 (이메일, 프로필)</li>
                  <li>• 사주 정보 및 해석 결과</li>
                  <li>• 채팅 기록 및 대화 내용</li>
                  <li>• 궁합 분석 결과</li>
                  <li>• 결제 정보 및 코인 내역</li>
                  <li>• 피드백 및 평가 데이터</li>
                  <li>• 업로드한 파일 및 이미지</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-orange-600">보관되는 데이터</h3>
                <ul className="space-y-2 text-sm">
                  <li>• 법적 의무에 따른 결제 기록 (5년)</li>
                  <li>• 서비스 개선을 위한 익명화된 통계 데이터</li>
                  <li>• 부정 이용 방지를 위한 최소한의 로그 (30일)</li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 계정 삭제 양식 */}
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold">계정 삭제 요청 양식</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  계정 이메일 주소 *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="계정에 등록된 이메일을 입력하세요"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  삭제 사유 (선택사항)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="계정 삭제 사유를 입력해주세요 (서비스 개선에 도움이 됩니다)"
                  rows={3}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !email}
              >
                {isLoading ? "처리 중..." : "계정 삭제 요청"}
              </button>
            </form>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  isSuccess
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* 연락처 정보 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">문의 및 지원</h2>

            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <p>
                <strong>개발자:</strong> 사주핑(SajuPing) 개발팀
              </p>
              <p>
                <strong>앱 이름:</strong> 사주핑 - AI 사주 운세
              </p>
              <p>
                <strong>문의사항:</strong> 계정 삭제 관련 문의사항이 있으시면 앱 내 고객센터를 이용해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
