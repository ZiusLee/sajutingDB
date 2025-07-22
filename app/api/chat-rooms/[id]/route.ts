import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const chatRoomId = params.id

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get chat room with session info
    const { data: chatRoom, error } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        session_id,
        title,
        room_type,
        created_at,
        updated_at,
        saju_sessions (
          id,
          user_id,
          name,
          birth_date,
          birth_time,
          gender,
          birth_location,
          compressed_saju
        )
      `)
      .eq("id", chatRoomId)
      .single()

    if (error || !chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    return NextResponse.json({ chatRoom })
  } catch (error) {
    console.error("Error in GET /api/chat-rooms/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const chatRoomId = params.id
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: chatRoom, error } = await supabase
      .from("chat_rooms")
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatRoomId)
      .select()
      .single()

    if (error) {
      console.error("Error updating chat room:", error)
      return NextResponse.json({ error: "Failed to update chat room" }, { status: 500 })
    }

    return NextResponse.json({ chatRoom })
  } catch (error) {
    console.error("Error in PATCH /api/chat-rooms/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const chatRoomId = params.id

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Delete all messages in the chat room first
    const { error: messagesError } = await supabase.from("messages").delete().eq("chat_room_id", chatRoomId)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 })
    }

    // Delete the chat room
    const { error: roomError } = await supabase.from("chat_rooms").delete().eq("id", chatRoomId)

    if (roomError) {
      console.error("Error deleting chat room:", roomError)
      return NextResponse.json({ error: "Failed to delete chat room" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/chat-rooms/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
