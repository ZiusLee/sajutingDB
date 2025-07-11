import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Calendar, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6">
            당신의 운명을
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-blue-600">
              {" "}
              읽어드립니다
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            천년의 지혜가 담긴 사주명리학으로
            <br />
            당신만의 특별한 이야기를 발견하세요
          </p>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              내 사주 보기
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">간단한 3단계로 시작하세요</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">1. 정보 입력</h3>
                <p className="text-slate-600">
                  생년월일, 출생시간 등<br />
                  기본 정보를 입력해주세요
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">2. 사주 분석</h3>
                <p className="text-slate-600">
                  AI가 당신의 사주를
                  <br />
                  정확하게 분석합니다
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">3. 맞춤 상담</h3>
                <p className="text-slate-600">
                  궁금한 것을 언제든지
                  <br />
                  AI 상담사에게 물어보세요
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-600 to-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">지금 바로 시작해보세요</h2>
          <p className="text-xl text-amber-100 mb-8">무료로 당신의 사주를 확인하고 AI 상담을 받아보세요</p>
          <Link href="/onboarding">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-slate-800 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
