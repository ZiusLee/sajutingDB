import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { roomType, question } = await req.json()

    // 입력 검증
    if (!roomType || !question) {
      return NextResponse.json({ error: "roomType과 question은 필수 입력값입니다." }, { status: 400 })
    }

    // 쿠키에서 Supabase 클라이언트 생성
    const supabase = createRouteHandlerClient({ cookies })

    // 현재 인증된 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("사용자 인증 오류:", authError)
      return NextResponse.json({ error: "인증 오류가 발생했습니다." }, { status: 401 })
    }

    if (!user) {
      // 인증되지 않은 사용자는 질문을 저장하지 않고 성공으로 응답
      // 이렇게 하면 인증 오류로 인해 채팅이 중단되는 것을 방지할 수 있습니다
      return NextResponse.json({ success: true, message: "비로그인 사용자는 질문이 저장되지 않습니다." })
    }

    // 질문 저장 - 타임아웃 설정 (3초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    try {
      const { data, error } = await supabase
        .from("user_questions")
        .insert({
          user_id: user.id,
          room_type: roomType,
          question: question,
        })
        .select()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.error("질문 저장 오류:", error)
        // 오류가 발생해도 성공으로 응답하여 채팅 흐름에 영향을 주지 않음
        return NextResponse.json({ success: true, message: "질문 저장 중 오류가 발생했지만 채팅은 계속됩니다." })
      }

      return NextResponse.json({ success: true, data })
    } catch (insertError) {
      clearTimeout(timeoutId)
      console.error("질문 저장 중 예외 발생:", insertError)
      // 예외가 발생해도 성공으로 응답
      return NextResponse.json({ success: true, message: "질문 저장 중 예외가 발생했지만 채팅은 계속됩니다." })
    }
  } catch (error) {
    console.error("API 오류:", error)
    // API 오류가 발생해도 성공으로 응답
    return NextResponse.json({ success: true, message: "API 처리 중 오류가 발생했지만 채팅은 계속됩니다." })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const roomType = url.searchParams.get("roomType")

    // 쿠키에서 Supabase 클라이언트 생성
    const supabase = createRouteHandlerClient({ cookies })

    // 현재 인증된 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증된 사용자가 아닙니다." }, { status: 401 })
    }

    // 기본 쿼리 설정
    let query = supabase
      .from("user_questions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // 채팅방 유형이 제공된 경우 필터링
    if (roomType) {
      query = query.eq("room_type", roomType)
    }

    const { data, error } = await query

    if (error) {
      console.error("질문 조회 오류:", error)
      return NextResponse.json({ error: "질문을 조회하는 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "요청을 처리하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const questionId = url.searchParams.get("id")

    if (!questionId) {
      return NextResponse.json({ error: "질문 ID가 제공되지 않았습니다." }, { status: 400 })
    }

    // 쿠키에서 Supabase 클라이언트 생성
    const supabase = createRouteHandlerClient({ cookies })

    // 현재 인증된 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증된 사용자가 아닙니다." }, { status: 401 })
    }

    // 먼저 질문이 현재 사용자의 것인지 확인
    const { data: questionData, error: fetchError } = await supabase
      .from("user_questions")
      .select("user_id")
      .eq("id", questionId)
      .single()

    if (fetchError || !questionData) {
      return NextResponse.json({ error: "질문을 찾을 수 없습니다." }, { status: 404 })
    }

    if (questionData.user_id !== user.id) {
      return NextResponse.json({ error: "이 질문을 삭제할 권한이 없습니다." }, { status: 403 })
    }

    // 질문 삭제
    const { error: deleteError } = await supabase.from("user_questions").delete().eq("id", questionId)

    if (deleteError) {
      console.error("질문 삭제 오류:", deleteError)
      return NextResponse.json({ error: "질문을 삭제하는 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "요청을 처리하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
