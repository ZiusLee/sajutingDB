import { type NextRequest, NextResponse } from "next/server"
import { getChatRoomById, updateChatRoom, deleteChatRoom, getChatRoomWithMessages } from "@/lib/chat-service"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// 특정 채팅방 조회
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const chatRoomId = Number.parseInt(params.id)

    // 채팅방 및 메시지 조회
    const { chatRoom, messages } = await getChatRoomWithMessages(chatRoomId)

    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "채팅방을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (chatRoom.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      chatRoom,
      messages,
    })
  } catch (error) {
    console.error("채팅방 조회 오류:", error)
    return NextResponse.json({ success: false, message: "채팅방 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 채팅방 업데이트
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const chatRoomId = Number.parseInt(params.id)
    const chatRoomData = await req.json()

    // 채팅방 존재 확인
    const existingChatRoom = await getChatRoomById(chatRoomId)

    if (!existingChatRoom) {
      return NextResponse.json({ success: false, message: "채팅방을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (existingChatRoom.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    // 채팅방 업데이트
    const updatedChatRoom = await updateChatRoom(chatRoomId, chatRoomData)

    return NextResponse.json({
      success: true,
      chatRoom: updatedChatRoom,
    })
  } catch (error) {
    console.error("채팅방 업데이트 오류:", error)
    return NextResponse.json({ success: false, message: "채팅방 업데이트 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 채팅방 삭제
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const chatRoomId = Number.parseInt(params.id)

    // 채팅방 존재 확인
    const chatRoom = await getChatRoomById(chatRoomId)

    if (!chatRoom) {
      return NextResponse.json({ success: false, message: "채팅방을 찾을 수 없습니다." }, { status: 404 })
    }

    // 권한 확인
    if (chatRoom.user_id !== userId) {
      return NextResponse.json({ success: false, message: "접근 권한이 없습니다." }, { status: 403 })
    }

    // 채팅방 삭제
    const success = await deleteChatRoom(chatRoomId)

    return NextResponse.json({
      success,
      message: success ? "채팅방이 삭제되었습니다." : "채팅방 삭제에 실패했습니다.",
    })
  } catch (error) {
    console.error("채팅방 삭제 오류:", error)
    return NextResponse.json({ success: false, message: "채팅방 삭제 중 오류가 발생했습니다." }, { status: 500 })
  }
}
