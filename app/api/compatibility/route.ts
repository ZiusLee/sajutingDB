import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 서버 측에서 서비스 롤 키를 사용하여 Supabase 클라이언트 생���
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

// 궁합 분석 정보 가져오기
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const id = searchParams.get("id")

    let query = adminSupabase.from("compatibility_analysis").select("*")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (id) {
      query = query.eq("id", id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ compatibilityAnalysis: data })
  } catch (error) {
    console.error("Error fetching compatibility analysis:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// 궁합 분석 정보 생성 또는 업데이트
export async function POST(request: NextRequest) {
  try {
    const compatibilityData = await request.json()
    const { id, ...compatibilityInfo } = compatibilityData

    // ID가 있으면 업데이트, 없으면 생성
    if (id) {
      const { data, error } = await adminSupabase
        .from("compatibility_analysis")
        .update(compatibilityInfo)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ compatibilityAnalysis: data, action: "updated" })
    } else {
      const { data, error } = await adminSupabase
        .from("compatibility_analysis")
        .insert(compatibilityInfo)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ compatibilityAnalysis: data, action: "created" })
    }
  } catch (error) {
    console.error("Error creating/updating compatibility analysis:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// 궁합 분석 정보 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Compatibility analysis ID is required" }, { status: 400 })
    }

    const { error } = await adminSupabase.from("compatibility_analysis").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Compatibility analysis deleted successfully" })
  } catch (error) {
    console.error("Error deleting compatibility analysis:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
