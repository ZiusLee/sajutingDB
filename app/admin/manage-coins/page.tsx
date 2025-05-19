import type { Metadata } from "next"
import AdminCoinManager from "@/components/admin-coin-manager"

export const metadata: Metadata = {
  title: "코인 관리 | 사주핑",
  description: "사용자 코인을 관리하는 페이지입니다.",
}

export default function ManageCoinsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">코인 관리</h1>
      <AdminCoinManager />
    </div>
  )
}
