import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

export async function POST(request: NextRequest) {
  try {
    const { messageId, feedbackType, sessionId } = await request.json()

    if (!messageId || !feedbackType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate feedback type
    const validFeedbackTypes = ["like", "dislike", "retry", "copy"]
    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 })
    }

    // Check if messageId is a UUID (database ID) or AI SDK ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId)

    if (!isUUID) {
      // If it's not a UUID, it's probably an AI SDK message ID that hasn't been saved to DB yet
      console.log("Skipping feedback for non-UUID message ID:", messageId)
      return NextResponse.json({
        success: true,
        message: "Message not yet saved to database, feedback skipped",
      })
    }

    // Check if feedback already exists for this message and type
    const { data: existingFeedback } = await adminSupabase
      .from("message_feedback")
      .select("id")
      .eq("message_id", messageId)
      .eq("feedback_type", feedbackType)
      .single()

    if (existingFeedback) {
      return NextResponse.json({
        success: true,
        message: "Feedback already recorded",
        feedbackId: existingFeedback.id,
      })
    }

    // Insert new feedback
    const { data, error } = await adminSupabase
      .from("message_feedback")
      .insert({
        message_id: messageId,
        feedback_type: feedbackType,
        session_id: sessionId,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving message feedback:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
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

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 })
    }

    const { data: feedback, error } = await adminSupabase
      .from("message_feedback")
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: false })

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
