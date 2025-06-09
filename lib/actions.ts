"use server"

import { createClient } from "@/lib/supabase-server"

export async function saveMessages(sessionId: string, messages: any[], roomType: string) {
  try {
    const supabase = createClient()

    // Get session ID from database or create a new one
    let sessionDbId: string | null = null

    // Check if session exists
    const { data: existingSession } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("session_key", sessionId)
      .single()

    if (existingSession) {
      sessionDbId = existingSession.id
    } else {
      // Create a new session
      const { data: newSession, error: sessionError } = await supabase
        .from("saju_sessions")
        .insert({
          session_key: sessionId,
          room_type: roomType,
        })
        .select("id")
        .single()

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`)
      }

      sessionDbId = newSession.id
    }

    if (!sessionDbId) {
      throw new Error("Failed to get or create session")
    }

    // Save messages
    const messagesToInsert = messages.map((message) => ({
      session_id: sessionDbId,
      role: message.role,
      content: message.content,
      message_order: messages.indexOf(message),
      client_message_id: message.id,
    }))

    const { data: insertedMessages, error: messagesError } = await supabase
      .from("messages")
      .insert(messagesToInsert)
      .select("id, client_message_id")

    if (messagesError) {
      throw new Error(`Failed to save messages: ${messagesError.message}`)
    }

    // Create a mapping of client message IDs to database IDs
    const messageIds = insertedMessages.reduce((acc: Record<string, string>, message) => {
      acc[message.client_message_id] = message.id
      return acc
    }, {})

    return messageIds
  } catch (error) {
    console.error("Error saving messages:", error)
    throw error
  }
}
