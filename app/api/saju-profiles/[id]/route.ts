import { type NextRequest, NextResponse } from "next/server"
import { getSajuProfileById, updateSajuProfile, deleteSajuProfile } from "@/lib/saju-profile-service"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// 특정 사주 프로필 조회
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const profileId = Number.parseInt(params.id)

    // 프로필 조회
    const profile = await getSajuProfileById(profileId)

    if (!profile) {
      return NextResponse.json({ success: false, message: "프로필을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (profile.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("사주 프로필 조회 오류:", error)
    return NextResponse.json({ success: false, message: "사주 프로필 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 사주 프로필 업데이트
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const profileId = Number.parseInt(params.id)
    const profileData = await req.json()

    // 프로필 존재 확인
    const existingProfile = await getSajuProfileById(profileId)

    if (!existingProfile) {
      return NextResponse.json({ success: false, message: "프로필을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (existingProfile.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    // 프로필 업데이트
    const updatedProfile = await updateSajuProfile(profileId, profileData)

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    })
  } catch (error) {
    console.error("사주 프로필 업데이트 오류:", error)
    return NextResponse.json(
      { success: false, message: "사주 프로필 업데이트 중 오류가 발생했습니다." },
      { status: 500 },
    )
  }
}

// 사주 프로필 삭제
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const profileId = Number.parseInt(params.id)

    // 프로필 존재 확인
    const profile = await getSajuProfileById(profileId)

    if (!profile) {
      return NextResponse.json({ success: false, message: "프로필을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (profile.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    // 프로필 삭제
    const success = await deleteSajuProfile(profileId)

    return NextResponse.json({
      success,
      message: success ? "프로필이 삭제되었습니다." : "프로필 삭제에 실패했습니다.",
    })
  } catch (error) {
    console.error("사주 프로필 삭제 오류:", error)
    return NextResponse.json({ success: false, message: "사주 프로필 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
