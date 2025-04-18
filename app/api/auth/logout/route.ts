import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // 인증 쿠키 삭제
  cookies().delete("auth_token")

  return NextResponse.json({
    success: true,
    message: "로그아웃되었습니다.",
  })
}
