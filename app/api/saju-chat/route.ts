import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages, saju, name, gender, initialInterpretation, roomType, userId, currentYear, yearDescription } =
      await req.json()

    // Ensure we have the required data
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Prepare system message with context about the user's saju
    const sajuInfo = saju
      ? `
사용자 정보:
- 이름: ${name || "사용자"}
- 성별: ${gender || "미상"}
- 사주: ${JSON.stringify(saju)}
- 초기 해석: ${initialInterpretation || "없음"}
- 채팅방 유형: ${roomType || "general"}
- 현재 연도: ${currentYear || 2025}년 ${yearDescription || "을사년(乙巳年)"}
`
      : "사용자 정보가 제공되지 않았습니다."

    // System message to guide the AI's responses
    const systemMessage = {
      role: "system",
      content: `당신은 사주 전문가입니다. 사용자의 사주를 바탕으로 ${roomType || "일반적인"} 상담을 제공합니다.

${sajuInfo}

다음 지침을 따르세요:
1. 사용자의 사주 정보를 바탕으로 답변하세요.
2. 답변은 친절하고 명확하게 제공하세요.
3. 사주 용어를 사용할 때는 간단한 설명을 함께 제공하세요.
4. 사용자가 이해하기 쉽도록 실용적인 조언을 제공하세요.
5. 답변은 3-4문단 정도로 간결하게 유지하세요.
6. 마크다운 형식을 사용하여 답변을 구조화하세요.`,
    }

    // Combine system message with user messages
    const apiMessages = [systemMessage, ...messages]

    const result = streamText({
      model: openai("gpt-4-turbo"),
      system: systemMessage.content,
      messages: apiMessages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in saju-chat API route:", error)
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
