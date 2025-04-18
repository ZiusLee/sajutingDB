import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 서버 측에서 서비스 롤 키를 사용하여 Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

// 생년월일 정보 가져오기
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const id = searchParams.get("id")

    let query = adminSupabase.from("birth_info").select("*")

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

    return NextResponse.json({ birthInfo: data })
  } catch (error) {
    console.error("Error fetching birth info:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// 생년월일 정보 생성 또는 업데이트
export async function POST(request: NextRequest) {
  try {
    const birthData = await request.json()
    const { id, ...birthInfo } = birthData

    // ID가 있으면 업데이트, 없으면 생성
    if (id) {
      const { data, error } = await adminSupabase.from("birth_info").update(birthInfo).eq("id", id).select().single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ birthInfo: data, action: "updated" })
    } else {
      const { data, error } = await adminSupabase.from("birth_info").insert(birthInfo).select().single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ birthInfo: data, action: "created" })
    }
  } catch (error) {
    console.error("Error creating/updating birth info:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// 생년월일 정보 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Birth info ID is required" }, { status: 400 })
    }

    const { error } = await adminSupabase.from("birth_info").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Birth info deleted successfully" })
  } catch (error) {
    console.error("Error deleting birth info:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
