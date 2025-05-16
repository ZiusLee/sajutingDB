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

    // auth.users 테이블에서 사용자 정보 가져오기
    const { data: users, error } = await adminSupabase.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let filteredUsers = users.users

    // 이메일로 필터링
    if (email) {
      filteredUsers = filteredUsers.filter(
        (user) => user.email && user.email.toLowerCase().includes(email.toLowerCase()),
      )
    }

    // ID로 필터링
    if (id) {
      filteredUsers = filteredUsers.filter((user) => user.id === id)
    }

    // 필요한 정보만 추출
    const simplifiedUsers = filteredUsers.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
    }))

    return NextResponse.json({ users: simplifiedUsers })
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
      const { data, error } = await adminSupabase.auth.admin.updateUserById(id, userInfo)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ user: data.user, action: "updated" })
    } else {
      // 새 사용자 생성 로직
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email: userInfo.email,
        password: userInfo.password,
        email_confirm: true,
        user_metadata: userInfo.user_metadata,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ user: data.user, action: "created" })
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

    const { error } = await adminSupabase.auth.admin.deleteUser(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
