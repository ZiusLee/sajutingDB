import type { Metadata } from "next"
import UpdateSajuClientPage from "./UpdateSajuClientPage"

export const metadata: Metadata = {
  title: "사주 데이터 업데이트 | 관리자",
  description: "사주 세션 데이터를 업데이트하는 관리자 페이지입니다.",
}

export default function UpdateSajuPage() {
  return <UpdateSajuClientPage />
}
