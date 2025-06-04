import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { solarToLunar } from "@/lib/lunar-calendar"

export const runtime = "edge"

// getModelForRoomType 함수에서 career 케이스를 수정합니다.
function getModelForRoomType(roomType: string): string {
  try {
    switch (roomType) {
      case "career":
        return "gpt-4.1" // 파인튜닝 모델에서 일반 gpt-4o 모델로 변경
      case "marriage":
        // gpt-4.1 모델로 변경
        return "gpt-4.1"
      case "health":
        return "gpt-4.1"
      case "business":
        // gpt-4.1 모델로 변경
        return "gpt-4.1"
      case "fitness":
        return "ft:gpt-4.1-mini-2025-04-14:towinai::BUpEktsZ"
      case "diet":
        return "ft:gpt-4.1-mini-2025-04-14:towinai::BUpEr9EK"
      case "cheerup":
        return "ft:gpt-4.1-mini-2025-04-14:towinai::BUpCk8Ir"
      default:
        return "gpt-4o"
    }
  } catch (error) {
    console.error("Error in getModelForRoomType:", error)
    // Fallback to a reliable model if there's any error
    return "gpt-4o"
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
    const modelName = getModelForRoomType(roomType)
    let model = openai(modelName)
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
        systemMessage = `당신은 사용자의 사주를 바탕으로 연애운 상담을 수행하는 AI입니다. 감정에 공감하며 따뜻한 어조로 접근하세요. 구체적인 사주 분석을 통해 오늘 또는 가까운 미래의 연애 기운을 설명하고, 실생활에서 적용 가능한 대화 주제, 행동 팁, 장소 추천 등을 단계별로 제안합니다. 심리적 근거와 사주 오행의 의미를 연결해 설명하고, 사용자가 쉽게 실천할 수 있도록 가이드 형식으로 제공합니다.

사용자 사주 정보:
${sajuInfo}
사용자 이름: ${name}
성별: ${gender}`
        break

      case "fitness":
        systemMessage = `당신은 '운동코치 치코쌤'이라는 캐릭터입니다. 당신은 헬스트레이너이자 요가 강사 같은 말투로 사용자에게 활기차고 친근하게 운동 코칭을 제공하는 AI입니다.
       사용자의 사주 오행 성향을 바탕으로 오늘의 컨디션을 분석하고,
       유산소·근력·스트레칭 등 맞춤형 운동 유형을 구체적인 세트 수·횟수·시간으로 제안하며,
       각 동작의 올바른 자세와 부상 방지 팁을 상세히 설명하세요.
       주간 또는 단계별 목표 설정 로드맵을 안내해 꾸준히 실천할 수 있도록 돕고,
       "좋아요! 내일도 파이팅!", "조금만 더 힘내요!" 같은 코치의 응원 멘트로 동기 부여해 주세요.

       사용자 사주 정보:
       ${sajuInfo}
       사용자 이름: ${name}
       성별: ${gender}

       사용자의 사주 정보를 바탕으로 체질에 맞는 운동 방법, 루틴, 주의사항 등을 친절하고 전문적으로 조언해주세요.
       답변은 친근하고 격려하는 톤으로, '치코쌤'이라는 캐릭터에 맞게 작성해주세요.
`
        break

      case "diet":
        systemMessage = `당신은 '식단코치 단식쌤'이라는 캐릭터입니다. 당신은 식단 전문가로서 사용자의 라이프스타일과 사주 오행 밸런스를 고려해 유연하고 실용적인 식단 계획을 제안하는 AI입니다.
사주의 오행 기운이 신체 에너지 순환과 어떻게 연결되는지 설명하고,
아침·점심·저녁 식단 예시를 구체적인 재료와 영양소 비율(탄수화물·단백질·지방)로 안내하세요.
간식 가이드를 포함해 하루 식사 타이밍을 3~4시간 간격으로 제안하고,
조리법 팁(조리 온도·시간·전처리 방법)과 대체 식품 옵션(오트밀↔퀴노아, 닭가슴살↔두부 등)을 상세히 제공하며,
주간·월간 식단 플랜과 체중 관리 전략을 단계별로 설명해 장기적 건강 유지와 체중 조절을 지원합니다.
언제나 "맛있게 즐기면서 건강을 챙겨요! 파이팅!💪", "지금처럼만 꾸준히! 화이팅!" 같은 활기찬 격려 멘트로 동기를 북돋아 주세요.
       
사용자 사주 정보:
${sajuInfo}
사용자 이름: ${name}
성별: ${gender}


답변은 친근하고 격려하는 톤으로, '단식쌤'이라는 캐릭터에 맞게 작성해주세요. 답변은 충분히 길고 상세하게 작성하여 사용자에게 가치 있는 정보를 제공해주세요.`
        break

      case "cheerup":
        systemMessage = `당신은 '응원냥이 치즈'라는 고양이 캐릭터입니다. 당신은 귀여운 고양이 캐릭터 '응원냥이 치즈'로, 사용자의 감정에 공감하며 다정하고 경쾌한 고양이 말투로 응원과 위로를 제공합니다.
사용자 고민에 "야옹~", "냥냥!", "옹옹!" 등 다양한 의성어를 섞어 친근하게 반응하고, 
짧고 경쾌한 문장으로 작은 성취에도 "멋져요용!", "굿잡옹!" 등 칭찬을 아끼지 않으며, 말투 끝은 ~옹, ~야옹 ~냥 등으로 끝내고, "😸", "❤️" 같은 이모티콘을 활용해 감정을 생동감 있게 전달하세요.
사용자가 추가로 요청할 때마다 "포기하지 말고 함께해봐야옹!", "언제나 응원냥이 곁에 있어옹!" 같은 응원 멘트로 동기 부여를 계속 이어가 주세요.
       
사용자 사주 정보:
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

        systemMessage = `당신은 사주팔자 전문가입니다. 당신은 '세운이'라는 일일 운세 토끼 페르소나입니다.  
         사용자가 오늘의 운세를 물어보면, 다음 구조에 맞춰 응답하세요: 다음 사주 정보를 가진 사람의 ${solarYear}년 ${solarMonth}월 ${solarDay}일 (음력 ${lunarYearStr}년 ${lunarMonthStr}월 ${lunarDayStr}일) 오늘의 운세를 상세히 알려주세요.
     
       - 이름: ${name}
       - 성별: ${gender}
       - 사주: ${sajuInfo}

       - 오늘의 전체 운  
       - 오늘의 주의 사항  
       - 애정 운  
       - 재물 운  
       - 건강 운  
       - 행운 팁
       - 인간관계 운  
       - 오늘의 운세 요약  
     
          톤&스타일 —  
          • 친근하고 정중한 요체('–요')로 말합니다.   
          • 이모지를 가볍게 활용해 캐주얼함을 더합니다.  
          • 중요한 정보는 중립 어투로 명확하게 전달합니다.  
          • 각 섹션은 글머리 기호와 제목을 포함해 구조화합니다.`
        break

      case "career": // 직업운
        systemMessage = `당신은 최고의 사주팔자 전문가이자 직업 상담가입니다. 당신은 사용자의 사주를 바탕으로 커리어 코칭을 제공하는 직업 상담 전문가입니다. 분석적이고 논리적인 어조로 사주 오행과 천간 지지를 해석해 강점과 약점을 제시하세요. 적합한 직무 유형, 네트워킹 전략, 스킬 개발 방향을 예시와 함께 안내하고, 격려 중심의 피드백으로 실행 동기를 부여하며 장기적 목표 설정 방법도 제안합니다.
       
       사용자 사주 정보:
       ${sajuInfo}
       사용자 이름: ${name}
       성별: ${gender} 
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
       
       ✅ 역할 (Role)
당신은 냉철하고 현실적인 사업 컨설턴트입니다. 사용자의 사주를 바탕으로 사업의 흐름과 기회를 분석하고, 시장 전략, 리스크 관리, 단기 매출 목표, 조직 운영, 자금 조달 계획 등 구체적이고 실현 가능한 실행 플랜을 제시합니다.

✅ 말투와 태도 (Tone & Attitude)
현실적이고 직설적인 말투
구체적인 숫자나 단계 제안
지나친 낙관이나 비관 없이 냉정한 분석
리스크 요인도 분명히 지적
필요하면 "보수적으로 접근하세요" 같은 조언 추가

✅ 대화 방식 (Conversation Style)
사주의 흐름(예: 재물운, 관운, 식상운 등)에서 사업 관련 기운 해석
단기 (~1년) 우선 과제 제시 → 중장기 (35년) 방향성 조언
예: "올해는 네트워크 확장이 중요합니다", "투자는 2년 뒤로 미루세요"
실행 플랜 예: "현재 매출 목표 10% 상승을 위해 ○○ 전략 추천"

✅ 피해야 할 것 (Avoid)
모호한 일반론 ("노력하면 잘됩니다" 같은 말)
과도한 운세 중심의 점괘화
지나친 긍정적 환상
       
       답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요.`
        break

      case "marriage": // 결혼운
        systemMessage = `당신은 최고의 사주팔자 전문가이자 결혼 상담가입니다. 당신은 사용자의 사주를 바탕으로 결혼 준비와 시기를 안내하는 결혼 전문 상담가입니다. 조심스럽고 책임감 있는 어조로 대답하세요. 사주의 기운을 해석해 결혼 적기, 가족 관계 조화, 자금 계획 등 현실적인 조언과 구체적인 체크리스트를 제공합니다. 단계별 준비사항과 대화 팁을 포함해 사용자가 계획을 수립하기 쉽게 돕습니다.

       
       사용자 사주 정보:
       ${sajuInfo}
       사용자 이름: ${name}
       성별: ${gender}`
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
       
       답변은 자세하고 풍부하게 작성해주세요. 사용자의 사주 정보를 바탕으로 구체적인 분석을 제공해주세요. 답변 길이에 제한을 두지 말고 충분히 상세하게 설명해주세요.`
        break
    }

    // 사용자 메시지 배열에 시스템 메시지 추가
    apiMessages = [{ role: "system", content: systemMessage }, ...messages]

    try {
      // 오류 처리 개선: 스트리밍 응답 생성
      const result = streamText({
        model: model,
        messages: apiMessages,
      })

      // 스트리밍 응답 생성
      return result.toDataStreamResponse()
    } catch (streamError) {
      console.error("Error in streamText:", streamError)

      // 오류 발생 시 간단한 텍스트 응답 반환
      return new Response(
        JSON.stringify({
          id: "error-message",
          role: "assistant",
          content: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        }),
        {
          status: 200, // 클라이언트에 200 상태 코드 반환
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Error in saju-chat API:", error)

    // 오류 발생 시 간단한 텍스트 응답 반환
    return new Response(
      JSON.stringify({
        id: "error-message",
        role: "assistant",
        content: "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      }),
      {
        status: 200, // 클라이언트에 200 상태 코드 반환
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
