import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 서버 측에서 서비스 롤 키를 사용하여 Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

// 사용자 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")
    const id = searchParams.get("id")

    let query = adminSupabase.from("users").select("*")

    if (email) {
      query = query.eq("email", email)
    }

    if (id) {
      query = query.eq("id", id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// 사용자 생성 또는 업데이트
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const { id, ...userInfo } = userData

    // ID가 있으면 업데이트, 없으면 생성
    if (id) {
      const { data, error } = await adminSupabase.from("users").update(userInfo).eq("id", id).select().single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ user: data, action: "updated" })
    } else {
      const { data, error } = await adminSupabase.from("users").insert(userInfo).select().single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ user: data, action: "created" })
    }
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// 사용자 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { error } = await adminSupabase.from("users").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
