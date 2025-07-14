"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import BirthDateFormClient from "@/components/birth-date-form-client"
import { SajuLogo } from "@/components/saju-logo"

export default function LandingPageClient() {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <SajuLogo size="lg" className="mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">나만의 사주 분석</h1>
            <p className="text-gray-600">정확한 생년월일과 시간을 입력해주세요</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>사주 정보 입력</CardTitle>
              <CardDescription>AI가 당신의 사주를 분석해드립니다</CardDescription>
            </CardHeader>
            <CardContent>
              <BirthDateFormClient />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <SajuLogo size="lg" className="mb-8" />
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI와 함께하는 <br />
            <span className="text-purple-600">스마트한 사주 상담</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            전통 사주학과 최신 AI 기술이 만나 더욱 정확하고 개인화된 사주 분석을 제공합니다
          </p>
          <Button size="lg" className="text-lg px-8 py-4" onClick={() => setShowForm(true)}>
            무료로 사주 보기 🔮
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">왜 사주핑을 선택해야 할까요?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="text-4xl mb-4">🤖</div>
                <CardTitle>AI 기반 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  최신 AI 기술로 전통 사주학을 현대적으로 해석하여 더욱 정확한 분석을 제공합니다
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-4xl mb-4">💬</div>
                <CardTitle>실시간 맥락 기반 상담</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  궁금한 점을  가변적 맥락을 바탕으로 언제든지 AI 사주 전문가와 실시간으로 대화하며 해결할 수 있습니다
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-4xl mb-4">🔒</div>
                <CardTitle>개인정보 보호</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  모든 개인정보는 안전하게 암호화되어 저장되며, 사용자의 프라이버시를 최우선으로 보호합니다
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-purple-600 text-white">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">지금 바로 시작해보세요</h2>
          <p className="text-xl mb-8 opacity-90">무료로 나만의 사주를 확인하고 AI와 상담해보세요</p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4" onClick={() => setShowForm(true)}>
            사주 분석 시작하기
          </Button>
        </div>
      </section>
    </div>
  )
}
