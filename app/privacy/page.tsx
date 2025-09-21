import type { Metadata } from "next"
import PrivacyClientPage from "./privacy-client"

export const metadata: Metadata = {
  title: "개인정보처리방침 | 사주핑",
  description: "사주핑의 개인정보처리방침을 확인하세요.",
}

export default function PrivacyPage() {
  return <PrivacyClientPage />
}
