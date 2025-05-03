import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { solarToLunar } from "@/lib/lunar-calendar"

export const runtime = "edge"

// Add a function to select the appropriate model based on room type
function getModelForRoomType(roomType: string): string {
  switch (roomType) {
    case "career":
      return "ft:gpt-4.1-mini-2025-04-14:towinai::BSGiM5km"
    case "marriage":
      return "ft:gpt-4.1-mini-2025-04-14:towinai:marriage:BSGijgJ5"
    case "health":
      return "ft:gpt-4.1-mini-2025-04-14:towinai:health:BSGjioE0"
    default:
      return "gpt-4o" // Default model for other room types
  }
}

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

    // 모델 선택 및 시스템 메시지 설정
    let model = openai(getModelForRoomType(roomType)) // 기본 모델은 gpt-4.1-mini
    let systemMessage = ""
    let apiMessages = []

    // 룸 타입에 따른 모델 및 시스템 메시지 설정
    switch (roomType) {
      case "personalized":
        // 개인화된 상담은 파인튜닝 모델 사용
        model = openai("ft:gpt-4.1-2025-04-14:towinai::BP66DQ1v")
        // 파인튜닝 모델은 자체 시스템 메시지를 가지고 있으므로 최소한의 컨텍스트만 제공
        systemMessage = `사용자 사주 정보:
${sajuInfo}
사용자 이름: ${name}
성별: ${gender}`
        break

      case "love":
        // 애정운 상담은 애정운 특화 파인튜닝 모델 사용
        model = openai("ft:gpt-4.1-mini-2025-04-14:towinai::BSFwa3vL")
        // 파인튜닝 모델은 자체 시스템 메시지를 가지고 있으므로 최소한의 컨텍스트만 제공
        systemMessage = `사용자 사주 정보:
${sajuInfo}
사용자 이름: ${name}
성별: ${gender}`
        break

      case "daily-fortune":
        // 오늘 날짜를 가져와 음력으로 변환
        const today = new Date()
        const solarYear = today.getFullYear()
        const solarMonth = today.getMonth() + 1
        const solarDay = today.getDate()

        const lunarDate = solarToLunar(solarYear, solarMonth, solarDay)
        const lunarYearStr = lunarDate.year.toString()
        const lunarMonthStr = lunarDate.month.toString().padStart(2, "0")
        const lunarDayStr = lunarDate.day.toString().padStart(2, "0")

        systemMessage = `당신은 사주팔자 전문가입니다. 다음 사주 정보를 가진 사람의 ${solarYear}년 ${solarMonth}월 ${solarDay}일 (음력 ${lunarYearStr}년 ${lunarMonthStr}월 ${lunarDayStr}일) 오늘의 운세를 상세히 알려주세요.
      
        - 이름: ${name}
        - 성별: ${gender}
        - 사주: ${sajuInfo}

        다음 사항을 포함해주세요:
        - 오늘의 총운
        - 애정운
        - 재물운
        - 건강운
        - 행운의 요소 (색깔, 장소, 물건)

        답변은 자세하고 풍부하게 작성해주세요. 각 운세 항목에 대해 충분한 설명을 제공해주세요.`
        break

      case "career": // 직업운
        systemMessage = `당신은 최고의 사주팔자 전문가이자 직업 상담가입니다. 사용자의 직업운에 대해 자세하고 통찰력 있게 답변해주세요.
        
        사용자 사주 정보:
        ${sajuInfo}
        사용자 이름: ${name}
        성별: ${gender}
        
        직업운에 관한 질문에 답변할 때는 다음 사항을 고려해주세요:
        - 사용자의 타고난 직업적 재능과 적성
        - 현재와 미래의 직업 운세
        - 올해 을사년(2025년)의 직업 운세
        - 사용자에게 유리한 직업 분야와 방향
        - 직업적 성공을 위한 조언
        
        답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break

      case "health": // 건강운
        systemMessage = `당신은 최고의 사주팔자 전문가이자 건강 상담가입니다. 사용자의 건강운에 대해 자세하고 통찰력 있게 답변해주세요.
        
        사용자 사주 정보:
        ${sajuInfo}
        사용자 이름: ${name}
        성별: ${gender}
        
        건강운에 관한 질문에 답변할 때는 다음 사항을 고려해주세요:
        - 사용자의 타고난 체질과 건강 특성
        - 현재와 미래의 건강 운세
        - 올해 을사년(2025년)의 건강 운세
        - 주의해야 할 건강 문제
        - 건강 증진을 위한 조언
        
        답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break

      case "business": // 사업운
        systemMessage = `당신은 최고의 사주팔자 전문가이자 사업 상담가입니다. 사용자의 사업운에 대해 자세하고 통찰력 있게 답변해주세요.
        
        사용자 사주 정보:
        ${sajuInfo}
        사용자 이름: ${name}
        성별: ${gender}
        
        사업운에 관한 질문에 답변할 때는 다음 사항을 고려해주세요:
        - 사용자의 타고난 사업 재능과 특성
        - 현재와 미래의 사업 운세
        - 올해 을사년(2025년)의 사업 운세
        - 유리한 사업 분야와 방향
        - 사업 성공을 위한 조언
        
        답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break

      case "marriage": // 결혼운
        systemMessage = `당신은 최고의 사주팔자 전문가이자 결혼 상담가입니다. 사용자의 결혼운에 대해 자세하고 통찰력 있게 답변해주세요.
        
        사용자 사주 정보:
        ${sajuInfo}
        사용자 이름: ${name}
        성별: ${gender}
        
        결혼운에 관한 질문에 답변할 때는 다음 사항을 고려해주세요:
        - 사용자의 결혼 시기와 운세
        - 현재와 미래의 결혼 운세
        - 올해 을사년(2025년)의 결혼 운세
        - 이상적인 배우자 유형
        - 결혼 생활의 조화를 위한 조언
        
        답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break

      case "yearly": // 올해운상담
        systemMessage = `당신은 최고의 사주팔자 전문가입니다. 사용자의 올해 을사년(2025년) 운세에 대해 자세하고 통찰력 있게 답변해주세요.
        
        사용자 사주 정보:
        ${sajuInfo}
        사용자 이름: ${name}
        성별: ${gender}
        
        올해 운세에 관한 질문에 답변할 때는 다음 사항을 고려해주세요:
        - 올해 을사년(2025년)의 전반적인 운세
        - 각 분야별 운세 (건강, 재물, 애정, 직업 등)
        - 올해의 행운과 주의해야 할 점
        - 올해를 잘 보내기 위한 조언
        
        답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break

      default: // 기타 일반 상담
        systemMessage = `당신은 최고의 사주팔자 전문가이자 심리 상담가 입니다. 사용자에게 친절하고 자세하게 답변해주세요.
        
        사용자 사주 정보:
        ${sajuInfo}
        사용자 이름: ${name}
        성별: ${gender}
        
        답변할 때는 다음 사항을 고려해주세요:
        - 올해 을사년(2025년)의 운세와 영향
        - 사용자의 일주, 십성, 월지용신 등을 적극 활용
        - 사용자의 질문에 대한 깊이 있는 분석과 통찰
        
        답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break
    }

    // 사용자 메시지 배열에 시스템 메시지 추가
    apiMessages = [{ role: "system", content: systemMessage }, ...messages]

    const result = streamText({
      model: model,
      messages: apiMessages,
      temperature: 0.7,
      maxTokens: 1500, // 토큰 제한을 늘려서 더 긴 응답 유도
    })

    // 스트리밍 응답 생성
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in saju-chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
