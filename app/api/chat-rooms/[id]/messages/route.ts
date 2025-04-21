import { type NextRequest, NextResponse } from "next/server"
import { getChatRoomById, getMessagesByChatRoomId, createMessage, createMultipleMessages } from "@/lib/chat-service"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// 채팅방의 메시지 목록 조회
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const chatRoomId = Number.parseInt(context.params.id)

    // 채팅방 존재 확인
    const chatRoom = await getChatRoomById(chatRoomId)

    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "채팅방을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (chatRoom.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    // 메시지 목록 조회
    const messages = await getMessagesByChatRoomId(chatRoomId)

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error("메시지 목록 조회 오류:", error)
    return NextResponse.json({ success: false, message: "메시지 목록 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 메시지 생성
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const chatRoomId = Number.parseInt(context.params.id)

    // 채팅방 존재 확인
    const chatRoom = await getChatRoomById(chatRoomId)

    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "채팅방을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (chatRoom.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    const body = await request.json()

    // 단일 메시지 또는 여러 메시지 처리
    if (Array.isArray(body)) {
      // 여러 메시지 생성
      const messages = await createMultipleMessages(
        chatRoomId,
        body.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      )

      return NextResponse.json({
        success: true,
        messages,
      })
    } else {
      // 단일 메시지 생성
      const { role, content } = body

      if (!role || !content) {
        return NextResponse.json({ success: false, message: "역할과 내용은 필수입니다." }, { status: 400 })
      }

      const message = await createMessage({
        chat_room_id: chatRoomId,
        role,
        content,
      })

      return NextResponse.json({
        success: true,
        message,
      })
    }
  } catch (error) {
    console.error("메시지 생성 오류:", error)
    return NextResponse.json({ success: false, message: "메시지 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
