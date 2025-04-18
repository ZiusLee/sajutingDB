import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { anonymousId, userId } = await req.json()

    if (!anonymousId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Update birth_info table
    const { error: birthInfoError } = await supabase
      .from("birth_info")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (birthInfoError) {
      console.error("Error updating birth_info:", birthInfoError)
    }

    // Update saju_info table
    const { error: sajuInfoError } = await supabase
      .from("saju_info")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (sajuInfoError) {
      console.error("Error updating saju_info:", sajuInfoError)
    }

    // Update interpretations table
    const { error: interpretationsError } = await supabase
      .from("interpretations")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (interpretationsError) {
      console.error("Error updating interpretations:", interpretationsError)
    }

    // Update additional_questions table
    const { error: questionsError } = await supabase
      .from("additional_questions")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (questionsError) {
      console.error("Error updating additional_questions:", questionsError)
    }

    // Update compatibility_analysis table
    const { error: compatibilityError } = await supabase
      .from("compatibility_analysis")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (compatibilityError) {
      console.error("Error updating compatibility_analysis:", compatibilityError)
    }

    // Update chat_rooms table
    const { error: chatRoomsError } = await supabase
      .from("chat_rooms")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (chatRoomsError) {
      console.error("Error updating chat_rooms:", chatRoomsError)
    }

    // Update chat_messages table
    const { error: chatMessagesError } = await supabase
      .from("chat_messages")
      .update({ user_id: userId })
      .eq("user_id", anonymousId)

    if (chatMessagesError) {
      console.error("Error updating chat_messages:", chatMessagesError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in transfer-user-data API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
