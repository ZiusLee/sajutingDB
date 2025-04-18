import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Get the OpenAI API key with the correct capitalization
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.openai_Api_key

// Make sure we have the API key
if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key is not defined in environment variables")
}

// Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 서비스 롤 키가 없는 경우 에러 로깅
if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { feedback, interpretationId, sajuId, sajuData, feedbackText } = data

    console.log("Received feedback:", feedback, "for interpretation:", interpretationId)

    // 피드백 저장
    if (interpretationId) {
      // 기존 해석에 대��� 피드백 업데이트
      const { error: updateError } = await adminSupabase
        .from("interpretations")
        .update({
          user_feedback: feedback,
        })
        .eq("id", interpretationId)

      if (updateError) {
        console.error("Error updating interpretation feedback:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // 상세 피드백 정보 저장
      if (feedback) {
        const { error: feedbackError } = await adminSupabase.from("feedback").insert({
          interpretation_id: interpretationId,
          feedback_type: feedback,
          feedback_text: feedbackText || null,
        })

        if (feedbackError) {
          console.error("Error saving detailed feedback:", feedbackError)
        }
      }
    } else if (sajuData) {
      // 먼저 사주 데이터 저장 API 호출
      let userId = sajuData.userId

      if (!userId) {
        try {
          // 사주 데이터 저장 API 호출
          const saveResponse = await fetch(new URL("/api/save-saju-data", request.url).toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(sajuData),
          })

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json()
            throw new Error(errorData.error || `API request failed with status ${saveResponse.status}`)
          }

          const saveResult = await saveResponse.json()
          userId = saveResult.userId

          if (!userId) {
            throw new Error("No user ID returned from save-saju-data API")
          }

          // 사용자 ID를 sajuData에 저장
          sajuData.userId = userId
        } catch (saveError) {
          console.error("Error saving saju data before feedback:", saveError)
          return NextResponse.json(
            { error: saveError instanceof Error ? saveError.message : "Unknown error" },
            { status: 500 },
          )
        }
      }

      try {
        // 피드백만 저장 (해석 ID 없이)
        if (feedback) {
          const { error: feedbackError } = await adminSupabase.from("feedback").insert({
            user_id: userId,
            feedback_type: feedback,
            feedback_text: feedbackText || null,
          })

          if (feedbackError) {
            console.error("Error saving feedback:", feedbackError)
            return NextResponse.json({ error: feedbackError.message }, { status: 500 })
          }
        }

        // 해석 테이블에서 사용자의 해석 찾기 (있는 경우에만 업데이트)
        const { data: interpretations, error: getInterpretationError } = await adminSupabase
          .from("interpretations")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (getInterpretationError) {
          console.error("Error getting interpretation for feedback:", getInterpretationError)
          // 해석을 찾는 데 실패했지만 피드백은 이미 저장했으므로 성공으로 처리
          return NextResponse.json({
            success: true,
            message: "Feedback saved, but failed to update interpretation",
          })
        }

        // 해석이 있는 경우에만 업데이트
        if (interpretations && interpretations.length > 0) {
          const interpretationIdToUpdate = interpretations[0].id

          const { error: interpretationError } = await adminSupabase
            .from("interpretations")
            .update({
              user_feedback: feedback,
            })
            .eq("id", interpretationIdToUpdate)

          if (interpretationError) {
            console.error("Error updating existing interpretation feedback:", interpretationError)
            // 해석 업데이트에 실패했지만 피드백은 이미 저장했으므로 성공으로 처리
            return NextResponse.json({
              success: true,
              message: "Feedback saved, but failed to update interpretation",
            })
          }

          // 해석 ID가 있는 경우 피드백 테이블에 해석 ID 업데이트
          const { error: updateFeedbackError } = await adminSupabase
            .from("feedback")
            .update({
              interpretation_id: interpretationIdToUpdate,
            })
            .eq("user_id", userId)
            .is("interpretation_id", null)

          if (updateFeedbackError) {
            console.error("Error updating feedback with interpretation ID:", updateFeedbackError)
          }
        }
      } catch (error) {
        console.error("Error processing feedback:", error)
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in save-feedback API route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
