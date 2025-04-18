import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Create a server-side Supabase client with admin privileges
    const supabase = createServerSupabaseClient()

    // Insert compatibility analysis data
    const { data: analysisData, error: analysisError } = await supabase
      .from("compatibility_analysis")
      .insert({
        user_id: data.userId,
        partner_name: data.partnerName,
        partner_gender: data.partnerGender,
        partner_birth_year: data.partnerBirthYear,
        partner_birth_month: data.partnerBirthMonth,
        partner_birth_day: data.partnerBirthDay,
        partner_birth_hour: data.partnerBirthHour,
        partner_birth_minute: data.partnerBirthMinute,
        partner_time_unknown: data.partnerTimeUnknown,
        relationship_status: data.relationshipStatus || "unknown",
        compatibility_score: data.compatibilityScore || 0,
        analysis_text: data.analysisText || "",
        model_used: data.modelUsed || "unknown",
        response_time: data.responseTime || "client-side",
      })
      .select()

    if (analysisError) {
      console.error("Error inserting compatibility analysis:", analysisError)
      return NextResponse.json({ error: analysisError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: analysisData?.[0]?.id })
  } catch (error) {
    console.error("Error in save-compatibility API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
