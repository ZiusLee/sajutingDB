import type { Metadata } from "next"
import ManageCoinsClientPage from "./ManageCoinsClientPage"

export const metadata: Metadata = {
  title: "관리자 코인 관리 | 사주핑",
  description: "사용자 코인을 관리하는 관리자 페이지입니다.",
}

export default function ManageCoinsPage() {
  return <ManageCoinsClientPage />
}
