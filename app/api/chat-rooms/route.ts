import { type NextRequest, NextResponse } from "next/server"
import { createChatRoom, getChatRoomsByUserId } from "@/lib/chat-service"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// 채팅방 생성
export async function POST(req: NextRequest) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    const { saju_profile_id, room_type, title } = await req.json()

    // 필수 필드 확인
    if (!room_type) {
      return NextResponse.json({ success: false, message: "채팅방 유형은 필수입니다." }, { status: 400 })
    }

    // 채팅방 생성
    const chatRoom = await createChatRoom({
      user_id: userId,
      saju_profile_id,
      room_type,
      title,
    })

    return NextResponse.json({
      success: true,
      chatRoom,
    })
  } catch (error) {
    console.error("채팅방 생성 오류:", error)
    return NextResponse.json({ success: false, message: "채팅방 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 사용자의 채팅방 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 사용자 인증 확인
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    // 채팅방 목록 조회
    const chatRooms = await getChatRoomsByUserId(userId)

    return NextResponse.json({
      success: true,
      chatRooms,
    })
  } catch (error) {
    console.error("채팅방 목록 조회 오류:", error)
    return NextResponse.json({ success: false, message: "채팅방 목록 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}
