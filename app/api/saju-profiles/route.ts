import { type NextRequest, NextResponse } from "next/server"
import { createSajuProfile, getSajuProfilesByUserId } from "@/lib/saju-profile-service"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// 사주 프로필 생성
export async function POST(req: NextRequest) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const profileData = await req.json()

    // 필수 필드 확인
    if (
      !profileData.name ||
      !profileData.gender ||
      !profileData.birth_year ||
      !profileData.birth_month ||
      !profileData.birth_day ||
      !profileData.saju_data
    ) {
      return NextResponse.json({ success: false, message: "필수 정보가 누락되었습니다." }, { status: 400 })
    }

    // 사주 프로필 생성
    const profile = await createSajuProfile({
      ...profileData,
      user_id: userId,
    })

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("사주 프로필 생성 오류:", error)
    return NextResponse.json({ success: false, message: "사주 프로필 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 사용자의 사주 프로필 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    // 사주 프로필 목록 조회
    const profiles = await getSajuProfilesByUserId(userId)

    return NextResponse.json({
      success: true,
      profiles,
    })
  } catch (error) {
    console.error("사주 프로필 조회 오류:", error)
    return NextResponse.json({ success: false, message: "사주 프로필 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}
