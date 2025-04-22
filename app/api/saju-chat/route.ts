import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { generateGeminiText } from "@/lib/gemini-client"

// API 라우트의 타임아웃 설정을 60초로 변경
export const maxDuration = 60

// API 라우트의 오류 처리 및 로깅을 개선합니다
export async function POST(request: NextRequest) {
  // Add a fallback interpretation generator
  const createFallbackInterpretation = (error: any) => {
    return `
# 사주 해석 오류

사주 해석을 가져오는 중 오류가 발생했습니다.

## 기본적인 해석:
- 일주(日柱)를 중심으로 성격과 성향을 파악할 수 있습니다.
- 오행의 균형에 따라 삶의 방향성이 달라질 수 있습니다.
- 상세한 해석은 전문가와 상담하시는 것이 좋습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: ${error instanceof Error ? error.message : "알 수 없는 오류"}

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 인터넷 연결을 확인해보세요.
3. 잠시 후 다시 시도해보세요.
`
  }

  console.log("Received interpretation request")

  // 요청 본문 파싱
  let requestData
  try {
    requestData = await request.json()
  } catch (parseError) {
    console.error("Error parsing request JSON:", parseError)
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
  }

  const { saju, name, gender, questionSet = "basic", relationshipStatus = "solo" } = requestData

  if (!saju) {
    console.error("Missing saju data in request")
    return NextResponse.json({ error: "Missing saju data" }, { status: 400 })
  }

  // 사주 정보 추출
  const {
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch,
    elements,
    yearAnimal,
    dayMaster,
  } = saju

  // 이름과 성별 정보 추가
  const userName = name || "사용자"
  const userGender = gender || "male"
  const genderText = userGender === "male" ? "남성" : "여성"

  console.log(
    `Processing request for ${userName} (${genderText}), questionSet: ${questionSet}, relationshipStatus: ${relationshipStatus}`,
  )

  // 관계 상태에 따른 추가 분석 지침
  let relationshipGuidance = ""

  switch (relationshipStatus) {
    case "solo":
      relationshipGuidance = `
## 솔로 상태에서의 연애 전략 💌
- 나의 사주를 바탕으로 어떤 유형의 사람을 만나면 좋을지 구체적으로 알려주세요 (성격, 외모, 직업 등) 🧩
- 첫 만남에서 어떻게 접근하면 좋을지, 나의 사주 특성을 고려한 데이트 전략을 알려주세요 🎯
- 나의 사주에서 보이는 연애 시 주의점과 보완해야 할 점은 무엇인가요? ⚠️
- 솔로 탈출을 위해 내가 가장 집중해야 할 부분은 무엇인가요? 🔍
`
      break
    case "flirting":
      relationshipGuidance = `
## 썸 단계에서의 연애 전략 💕
- 현재 썸 타는 상대와의 관계를 발전시키기 위한 최적의 접근법은 무엇인가요? 🌱
- 상대방이 나에게 더 호감을 느낄 수 있도록 강조해야 할 나의 매력 포인트는 무엇인가요? ✨
- 썸에서 연애로 발전하기 위해 피해야 할 행동이나 대화 주제가 있나요? 🚫
- 상대방의 마음을 확인하기 좋은 시기와 방법은 무엇인가요? 🔮
`
      break
    case "dating":
      relationshipGuidance = `
## 연애 중인 상태에서의 관계 발전 전략 ❤️
- 현재 연애 관계를 더 깊고 의미있게 발전시키기 위한 방법은 무엇인가요? 🌈
- 파트너와의 갈등이 생길 수 있는 부분과 이를 해결하는 최적의 방법은 무엇인가요? 🔄
- 장기적인 관계로 발전할 가능성과 그를 위해 내가 노력해야 할 부분은 무엇인가요? 🌟
- 파트너에게 나의 사랑을 효과적으로 표현하는 방법은 무엇인가요? 💘
`
      break
    case "married":
      relationshipGuidance = `
## 결혼 생활에서의 조화로운 관계 유지 전략 💍
- 배우자와의 관계에서 내가 가진 강점과 보완해야 할 약점은 무엇인가요? 🏆
- 결혼 생활에서 발생할 수 있는 갈등 요소와 이를 예방하는 방법은 무엇인가요? 🛡️
- 배우자와 함께 성장하고 발전하기 위한 장기적인 관계 유지 방법은 무엇인가요? 🌱
- 가정 내에서 나의 역할과 책임을 효과적으로 수행하는 방법은 무엇인가요? 🏠
`
      break
    default:
      relationshipGuidance = `
## 일반적인 연애 전략 💞
- 나의 사주를 바탕으로 어떤 유형의 사람과 궁합이 좋을지 알려주세요 🧩
- 연애에서 나의 강점과 약점은 무엇이며, 어떻게 보완할 수 있을까요? 💪
- 이상적인 파트너의 특성과 그 이유는 무엇인가요? 🔍
- 건강한 연애 관계를 유지하기 위한 나만의 전략은 무엇인가요? 🌟
`
      break
  }

  // 기본 질문 세트 (1-2번 질문)
  const basicPrompt = `
사주팔자 전문가로서 다음 사주에 대한 해석을 제공해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}

- 이름: ${userName}
- 성별: ${genderText}
- 현재 관계 상태: ${
    relationshipStatus === "solo"
      ? "솔로"
      : relationshipStatus === "flirting"
        ? "썸타는 중"
        : relationshipStatus === "dating"
          ? "연애 중"
          : relationshipStatus === "married"
            ? "결혼 중"
            : "미상"
  }
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시주: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

다음 내용만 포함하여 해석해주세요:

# 나라는 사람의 연애운을 구체적으로 알기위해 🔮

일주를 바탕으로 구체적으로 설명해줘. 일간과 지지 모두 활용하는거 잊지말고
## 일주를 중심으로 본 나의 연애성향과 가치관 💕
- 나의 연애 스타일과 성향은 어떠한가? (주도적/수동적, 감정적/이성적 등) 💭
- 연애에서 내가 중요하게 생각하는 가치는 무엇인가? (외모, 성격, 재력, 신뢰 등) ✨
- 내가 연애에서 자주 보이는 문제점이나 단점은 무엇인가? ⚠️

## 본능과 궁합의 차이 ❤️
- 내가 본능적으로 끌리는 사람과 나와 잘맞는 사람은 어떻게 다르고, 그 이유는 무엇인가? 🧲
- 나에게 부족한 오행을 가진 사람이 좋은 궁합임을 고려하여 설명해주세요 🔄
- 나와 궁합이 좋은 사람의 특징 (성격, 외모, 직업 등)을 구체적으로 알려주세요 👫

## 연애운의 흐름 📅
- 내 연애운은 사주의 일간과 오행 분석을 기반으로 다음과 같이 예측할 수 있습니다:
 * 강한 연애운 시기: 사주의 일간과 오행 특성에 따라 현재부터 1년 내에 연애운이 가장 강한 달을 2-3개월 구체적으로 제시하세요. 예를 들어 "2024년 6월, 9월, 12월"과 같이 명확한 월을 지정해주세요. 🌟
 * 약한 연애운 시기: 마찬가지로 연애운이 약한 시기를 2-3개월 구체적으로 제시하세요. 🌧️
 * 각 시기별 이유: 해당 시기에 연애운이 강하거나 약한 이유를 사주 원리에 따라 설명해주세요. 특히 일간과 오행의 관계, 대운과의 상호작용을 중심으로 설명하세요. 📊
- 연애운이 약한 시기에는 어떻게 대처하는 것이 좋은지, 구체적인 행동 지침 3가지를 제시해주세요. 💪

${relationshipGuidance}

## 운명적인 인연 🌠
- 운명적인 인연을 만날 가능성이 가장 높은 환경 (직장, 여행, 소개팅, 취미 등)은 어디인가? 🌈
- 그 사람을 알아볼 수 있는 결정적 특징은 무엇인가? (외모, 성격, 첫인상 등) 🔍
- 궁합이 좋은 구체적인 사주 조합 2가지 유저나이 기준으로 비슷한사람 추천 (생년월일과 궁합 점수 포함)와 이유 🔢 (나이대 4살 위 아래만 추천해줘 남자한테는 여자이름 여자한테는 남자이름. 8살 이상 차이나는 사람은 보여주면 안돼.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요. 적절한 이모지를 사용하여 가독성을 높여주세요.`

  // 사용할 프롬프트 선택
  const prompt = basicPrompt

  // 비스트리밍 요청 처리
  const startTime = Date.now()
  let interpretation = ""
  let responseTime = 0
  let modelUsed = "gemini"

  try {
    console.log("Attempting to generate text with Gemini model")

    // First try with Gemini
    interpretation = await generateGeminiText(
      [{ role: "user", content: prompt }],
      "당신은 사주팔자 전문가입니다. 사주에 대한 해석과 궁합이 좋은 사주 조합을 제공해주세요. 마크다운 형식으로 응답해주세요. 제목과 소제목을 사용하고, 내용은 구체적으로 작성해주세요. 적절한 이모지를 사용하여 가독성을 높여주세요. 특히 연애운의 흐름에 대해서는 일관성 있게 답변해주세요. 같은 사주에 대해서는 항상 동일한 시기를 연애운이 강하거나 약한 시기로 제시해야 합니다. 연애운 예측은 사주의 일간, 오행 분석, 대운을 기반으로 체계적으로 도출해주세요",
      0.8,
      4000,
    )

    responseTime = Date.now() - startTime
    console.log(`Gemini response generated in ${responseTime}ms`)
  } catch (geminiError) {
    console.error("Gemini API error, falling back to OpenAI:", geminiError)
    modelUsed = "openai"

    // Fallback to OpenAI
    try {
      // OpenAI API 키 확인
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is not defined")
        throw new Error("OpenAI API key is missing")
      }

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 0.8,
        maxTokens: 4000,
        apiKey: process.env.OPENAI_API_KEY,
        system:
          "당신은 사주팔자 전문가입니다. 사주에 대한 해석과 궁합이 좋은 사주 조합을 제공해주세요. 마크다운 형식으로 응답해주세요. 제목과 소제목을 사용하고, 내용은 구체적으로 작성해주세요. 적절한 이모지를 사용하여 가독성을 높여주세요. 특히 연애운의 흐름에 대해서는 일관성 있게 답변해주세요. 같은 사주에 대해서는 항상 동일한 시기를 연애운이 강하거나 약한 시기로 제시해야 합니다. 연애운 예측은 사주의 일간, 오행 분석, 대운을 기반으로 체계적으로 도출해주세요",
      })

      interpretation = text
      responseTime = Date.now() - startTime
      console.log(`OpenAI response generated in ${responseTime}ms`)
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)
      throw openaiError
    }
  }

  // 응답 반환
  return NextResponse.json({
    interpretation,
    model: modelUsed,
    responseTime: `${responseTime}ms`,
  })
}
