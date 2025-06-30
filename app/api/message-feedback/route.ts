import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

// 허용되는 피드백 타입 정의
const VALID_FEEDBACK_TYPES = ["like", "dislike", "copy", "regenerate"] as const
type FeedbackType = (typeof VALID_FEEDBACK_TYPES)[number]

interface MessageFeedback {
  id: string
  message_id: string
  feedback_type: FeedbackType
  session_id?: string
  created_at: Date
  selected_text?: string
  selection_start?: number
  selection_end?: number
  feedback_text?: string
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const {
      message_id,
      feedback_type,
      session_id,
      selected_text,
      selection_start,
      selection_end,
      feedback_text,
      metadata,
    } = await request.json()

    console.log("Received feedback request:", {
      message_id,
      feedback_type,
      session_id,
      selected_text: selected_text ? selected_text.substring(0, 50) + "..." : null,
    })

    if (!message_id || !feedback_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate feedback type
    if (!VALID_FEEDBACK_TYPES.includes(feedback_type as FeedbackType)) {
      console.error("Invalid feedback type:", feedback_type)
      return NextResponse.json({ error: `Invalid feedback type: ${feedback_type}` }, { status: 400 })
    }

    // Check if messageId is a UUID (database ID) or AI SDK ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(message_id)

    if (!isUUID) {
      // If it's not a UUID, it's probably an AI SDK message ID that hasn't been saved to DB yet
      console.log("Skipping feedback for non-UUID message ID:", message_id)
      return NextResponse.json({
        success: true,
        message: "Message not yet saved to database, feedback skipped",
        skipped: true,
      })
    }

    // Verify message exists in database
    const { data: messageExists, error: messageCheckError } = await adminSupabase
      .from("messages")
      .select("id")
      .eq("id", message_id)
      .single()

    if (messageCheckError || !messageExists) {
      console.log("Message not found in database:", message_id)
      return NextResponse.json({
        success: true,
        message: "Message not found in database, feedback skipped",
        skipped: true,
      })
    }

    // For like/dislike, check if feedback already exists and toggle it
    if (feedback_type === "like" || feedback_type === "dislike") {
      const { data: existingFeedback } = await adminSupabase
        .from("message_feedback")
        .select("id, feedback_type")
        .eq("message_id", message_id)
        .eq("session_id", session_id || "")
        .in("feedback_type", ["like", "dislike"])
        .maybeSingle()

      if (existingFeedback) {
        // If same feedback type exists, remove it (toggle off)
        if (existingFeedback.feedback_type === feedback_type) {
          const { error: deleteError } = await adminSupabase
            .from("message_feedback")
            .delete()
            .eq("id", existingFeedback.id)

          if (deleteError) {
            console.error("Error deleting feedback:", deleteError)
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            action: "removed",
            message: "Feedback removed",
          })
        } else {
          // If different feedback type exists, update it
          const { data, error: updateError } = await adminSupabase
            .from("message_feedback")
            .update({
              feedback_type,
              selected_text,
              selection_start,
              selection_end,
              feedback_text,
              metadata,
            })
            .eq("id", existingFeedback.id)
            .select("id")
            .single()

          if (updateError) {
            console.error("Error updating feedback:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            action: "updated",
            feedbackId: data.id,
          })
        }
      }
    }

    // For copy and regenerate, always create new entries (don't check for existing)
    // Prepare feedback data
    const feedbackData: Partial<MessageFeedback> = {
      message_id,
      feedback_type: feedback_type as FeedbackType,
      session_id: session_id || null,
    }

    // Add optional fields if provided
    if (selected_text) feedbackData.selected_text = selected_text
    if (typeof selection_start === "number") feedbackData.selection_start = selection_start
    if (typeof selection_end === "number") feedbackData.selection_end = selection_end
    if (feedback_text) feedbackData.feedback_text = feedback_text
    if (metadata) feedbackData.metadata = metadata

    console.log("Inserting feedback data:", feedbackData)

    const { data, error } = await adminSupabase.from("message_feedback").insert(feedbackData).select("id").single()

    if (error) {
      console.error("Error saving message feedback:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Feedback saved successfully:", data.id)

    return NextResponse.json({
      success: true,
      action: "created",
      feedbackId: data.id,
    })
  } catch (error) {
    console.error("Error in message-feedback API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("messageId")
    const sessionId = searchParams.get("sessionId")

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 })
    }

    let query = adminSupabase.from("message_feedback").select("*").eq("message_id", messageId)

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data: feedback, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching message feedback:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ feedback: feedback || [] })
  } catch (error) {
    console.error("Error in message-feedback GET API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
