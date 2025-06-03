import type { Metadata } from "next"
import { LandingPageClient } from "@/components/landing-page-client"

export const metadata: Metadata = {
  title: "사주핑 - 당신의 운세",
  description: "당신의 사주를 기반으로 한 맞춤형 운세 정보",
}

export default function LandingPage() {
  return <LandingPageClient />
}
