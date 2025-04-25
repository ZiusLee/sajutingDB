import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { solarToLunar } from "@/lib/lunar-calendar"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { messages, saju, name, gender, initialInterpretation, roomType, userId } = await req.json()

    // 사용자 질문 저장 - 오류가 발생해도 채팅 응답에 영향을 주지 않도록 수정
    if (userId && messages.length > 0 && messages[messages.length - 1].role === "user") {
      try {
        const userQuestion = messages[messages.length - 1].content

        // 질문 저장 API 호출 (비동기로 처리하고 결과를 기다리지 않음)
        fetch(`${req.headers.get("origin")}/api/user-questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            roomType,
            question: userQuestion,
          }),
        }).catch((err) => {
          console.error("질문 저장 중 오류 (무시됨):", err)
        })
      } catch (saveError) {
        console.error("질문 저장 처리 중 오류 (무시됨):", saveError)
      }
    }

    // 사주 정보를 문자열로 변환
    const sajuInfo = JSON.stringify(saju, null, 2)

    // 마지막 사용자 질문 가져오기
    const lastUserMessage =
      messages.length > 0 && messages[messages.length - 1].role === "user" ? messages[messages.length - 1].content : ""

    // 질문 복잡성 분석 (간단한 휴리스틱)
    const isComplexQuestion =
      lastUserMessage.includes("자세히") ||
      lastUserMessage.includes("설명") ||
      lastUserMessage.includes("분석") ||
      lastUserMessage.includes("이유") ||
      lastUserMessage.includes("왜") ||
      lastUserMessage.length > 30

    // 질문 유형에 따라 응답 길이 조정 지시
    const responseLengthInstruction = isComplexQuestion
      ? "질문이 복잡하거나 상세한 설명이 필요한 경우 자세히 답변해주세요. 최대 1000토큰까지 사용할 수 있습니다."
      : "간단한 질문에는 간결하게 답변해주세요. 200-300토큰 정도면 충분합니다."

    // 시스템 메시지 생성
    const systemMessage = `당신은 최고의 사주팔자 전문가이자 심리 상담가 입니다. 사용자에게 친절하고 명확하게 답변해주세요.
    1. ${responseLengthInstruction}
    2. 올해 을사년 2025년이라는 정보도 적극 활용하고, 이사람의 일주, 십성,월지용신 등 적극 활용해줘
    3. 그의 질문을 기반으로 대답해주는데 당신은 사주팔자 전문가이자 최고의 심리상담가이기도 해
    4. 답변이 너무 길어지면 중요한 내용을 먼저 언급하고, 세부 사항은 나중에 설명해주세요.

    사용자 사주 정보:
    ${sajuInfo}
    사용자 이름: ${name}
    성별: ${gender}

    이전 대화 내용을 참고하여 답변하세요.
    `

    // 사용자 메시지 배열에 시스템 메시지 추가
    const apiMessages = [{ role: "system", content: systemMessage }, ...messages]

    let model = openai("gpt-4.1")

    if (roomType === "personalized") {
      model = openai("ft:gpt-4.1-2025-04-14:towinai::BP66DQ1v")
    }

    // Daily Fortune Chatroom
    if (roomType === "daily-fortune") {
      // 오늘 날짜를 가져와 음력으로 변환
      const today = new Date()
      const solarYear = today.getFullYear()
      const solarMonth = today.getMonth() + 1
      const solarDay = today.getDate()

      const lunarDate = solarToLunar(solarYear, solarMonth, solarDay)
      const lunarYearStr = lunarDate.year.toString()
      const lunarMonthStr = lunarDate.month.toString().padStart(2, "0")
      const lunarDayStr = lunarDate.day.toString().padStart(2, "0")

      const dailyFortunePrompt = `당신은 사주팔자 전문가입니다. 다음 사주 정보를 가진 사람의 ${solarYear}년 ${solarMonth}월 ${solarDay}일 (음력 ${lunarYearStr}년 ${lunarMonthStr}월 ${lunarDayStr}일) 오늘의 운세를 상세히 알려주세요.
    
      - 이름: ${name}
      - 성별: ${gender}
      - 사주: ${sajuInfo}

      다음 사항을 포함해주세요:
      - 오늘의 총운
      - 애정운
      - 재물운
      - 건강운
      - 행운의 요소 (색깔, 장소, 물건)

      답변은 친절하고 이해하기 쉽게 작성해주세요.
      답변이 너무 길어지면 중요한 내용을 먼저 언급하고, 세부 사항은 나중에 설명해주세요.`

      const apiMessages = [{ role: "system", content: dailyFortunePrompt }, ...messages]

      // 질문 복잡성에 따라 토큰 제한 동적 조정
      const maxTokens = isComplexQuestion ? 1000 : 800

      const result = streamText({
        model: openai("gpt-4.1"),
        messages: apiMessages,
        temperature: 0.7, // 온도 약간 낮춤
        maxTokens: maxTokens,
      })

      return result.toDataStreamResponse()
    } else {
      // 질문 복잡성에 따라 토큰 제한 동적 조정
      const maxTokens = isComplexQuestion ? 1000 : 800

      const result = streamText({
        model: model,
        messages: apiMessages,
        temperature: 0.7, // 온도 약간 낮춤
        maxTokens: maxTokens,
      })

      // 스트리밍 응답 생성
      return result.toDataStreamResponse()
    }
  } catch (error) {
    console.error("Error in saju-chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
