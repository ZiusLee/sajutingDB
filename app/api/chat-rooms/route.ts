import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, title, roomType = "sajuping" } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Create new chat room
    const { data: chatRoom, error } = await supabase
      .from("chat_rooms")
      .insert({
        session_id: sessionId,
        title: title || "새로운 대화",
        room_type: roomType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating chat room:", error)
      return NextResponse.json({ error: "Failed to create chat room" }, { status: 500 })
    }

    return NextResponse.json({ chatRoom })
  } catch (error) {
    console.error("Error in POST /api/chat-rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get all chat rooms for the session with message counts and last message
    const { data: chatRooms, error } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        session_id,
        title,
        room_type,
        created_at,
        updated_at,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching chat rooms:", error)
      return NextResponse.json({ error: "Failed to fetch chat rooms" }, { status: 500 })
    }

    // Transform data to include message stats
    const transformedChatRooms = (chatRooms || []).map((room) => {
      const messages = room.messages || []
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null

      return {
        id: room.id,
        sessionId: room.session_id,
        title: room.title,
        roomType: room.room_type,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
        messageCount: messages.length,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              role: lastMessage.role,
              createdAt: lastMessage.created_at,
            }
          : null,
      }
    })

    return NextResponse.json({ chatRooms: transformedChatRooms })
  } catch (error) {
    console.error("Error in GET /api/chat-rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatRoomId = searchParams.get("chatRoomId")

    if (!chatRoomId) {
      return NextResponse.json({ error: "Chat room ID is required" }, { status: 400 })
    }

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
    console.error("Error in DELETE /api/chat-rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
