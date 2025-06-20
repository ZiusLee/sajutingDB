import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST(req: NextRequest) {
  try {
    const { userSaju, partnerSaju, sessionId } = await req.json()

    if (!userSaju || !partnerSaju) {
      return NextResponse.json({ error: "Missing userSaju or partnerSaju" }, { status: 400 })
    }

    // Save partnerSaju to saju_sessions table
    const partnerSajuResult = await sql`
      INSERT INTO saju_sessions (saju_data)
      VALUES (${JSON.stringify(partnerSaju)})
      RETURNING id;
    `

    const partnerSessionId = partnerSajuResult.rows[0].id

    // Update compatibility_analysis table with partnerSessionId
    if (sessionId) {
      await sql`
        UPDATE compatibility_analysis
        SET partner_session_id = ${partnerSessionId}
        WHERE id = ${sessionId};
      `

      return NextResponse.json(
        { message: "Compatibility analysis updated successfully", partnerSessionId },
        { status: 200 },
      )
    } else {
      // If sessionId is not provided, create a new entry in compatibility_analysis
      const newCompatibilityAnalysis = await sql`
        INSERT INTO compatibility_analysis (user_session_id, partner_session_id)
        VALUES ((SELECT id FROM saju_sessions WHERE saju_data = ${JSON.stringify(userSaju)}), ${partnerSessionId})
        RETURNING id;
      `

      const newSessionId = newCompatibilityAnalysis.rows[0].id

      return NextResponse.json(
        { message: "Compatibility analysis created successfully", sessionId: newSessionId, partnerSessionId },
        { status: 201 },
      )
    }
  } catch (error) {
    console.error("Error saving compatibility:", error)
    return NextResponse.json({ error: "Failed to save compatibility" }, { status: 500 })
  }
}
