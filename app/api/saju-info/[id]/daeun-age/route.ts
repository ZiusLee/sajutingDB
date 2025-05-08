import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic" // 캐싱 방지

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sajuId = params.id
    const { daeunAge } = await request.json()

    // 입력값 검증
    if (!sajuId || !daeunAge || typeof daeunAge !== "number" || daeunAge < 1 || daeunAge > 30) {
      return NextResponse.json({ success: false, error: "유효하지 않은 입력값입니다." }, { status: 400 })
    }

    console.log(`Updating daeun_age for saju_info ID ${sajuId} to ${daeunAge}`)

    // Supabase 클라이언트 생성
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

    // 사주 정보 업데이트
    const { data, error } = await supabase.from("saju_info").update({ daeun_age: daeunAge }).eq("id", sajuId).select()

    if (error) {
      console.error("Error updating daeun age:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("Successfully updated daeun_age:", data)

    // 업데이트된 데이터 반환
    return NextResponse.json(
      {
        success: true,
        message: "대운세수가 성공적으로 업데이트되었습니다.",
        data,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Error in daeun-age API:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
