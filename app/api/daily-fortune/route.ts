import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { solarToLunar } from "@/lib/lunar-calendar"

// Get the OpenAI API key with the correct capitalization
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.openai_Api_key

// Make sure we have the API key
if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key is not defined in environment variables")
}

// API 라우트의 타임아웃 설정을 60초로 변경
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log("Received daily fortune request")
    const { saju, name, gender, category } = await request.json()

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

    // 오늘 날짜를 가져와 음력으로 변환
    const today = new Date()
    const solarYear = today.getFullYear()
    const solarMonth = today.getMonth() + 1 // JavaScript months are 0-indexed
    const solarDay = today.getDate()

    const lunarDate = solarToLunar(solarYear, solarMonth, solarDay)
    const lunarYearStr = lunarDate.year.toString()
    const lunarMonthStr = lunarDate.month.toString().padStart(2, "0")
    const lunarDayStr = lunarDate.day.toString().padStart(2, "0")

    console.log(
      `Processing daily fortune request for ${userName} (${genderText}), category: ${category}, solar date: ${solarYear}-${solarMonth}-${solarDay}, lunar date: ${lunarYearStr}-${lunarMonthStr}-${lunarDayStr}`,
    )

    // 올해 을사년 정보 추가
    const currentYear = 2024
    const yearCycle = "을사년" // 2024년은 을사년

    // 카테고리별 프롬프트 생성
    let categoryPrompt = ""
    switch (category) {
      case "love":
        categoryPrompt = `
## 오늘의 연애운 💖
- 솔로인 경우: 새로운 만남이나 인연에 대한 가능성을 제시하고, 어떤 노력을 기울여야 할지 알려주세요.
- 연애 중인 경우: 현재 관계를 더욱 발전시키기 위한 팁이나 주의할 점을 알려주세요.
- 기혼인 경우: 배우자와의 관계를 더욱 돈독하게 유지하기 위한 방법이나 갈등을 예방하는 방법을 제시해주세요.
- 오늘의 일운과 을사년이 연애운에 미치는 영향을 구체적으로 설명해주세요.
- 행운의 데이트 장소나 선물 아이디어도 제안해주세요.`
        break
      case "money":
        categoryPrompt = `
## 오늘의 재물운 💰
- 금전적인 기회가 있는지, 혹은 지출을 주의해야 할 점이 있는지 알려주세요.
- 투자나 소비와 관련된 의사 결정을 할 때 참고할 만한 사항을 제시해주세요.
- 오늘의 일운과 을사년이 재물운에 미치는 영향을 구체적으로 설명해주세요.
- 금전 관리에 도움이 될 만한 팁이나 조언을 제공해주세요.
- 행운의 숫자나 방향도 알려주세요.`
        break
      case "career":
        categoryPrompt = `
## 오늘의 직업운 💼
- 직장에서의 인간관계나 업무 성과에 대한 조언을 제공해주세요.
- 승진이나 이직 등 커리어 변화에 대한 조언이 있다면 알려주세요.
- 오늘의 일운과 을사년이 직업운에 미치는 영향을 구체적으로 설명해주세요.
- 업무 효율을 높이기 위한 팁이나 주의해야 할 점을 알려주세요.
- 직장에서 행운을 가져올 수 있는 행동이나 물건을 제안해주세요.`
        break
      case "business":
        categoryPrompt = `
## 오늘의 사업운 📈
- 사업 관련 결정이나 계약에 대한 조언을 제공해주세요.
- 새로운 비즈니스 기회나 파트너십에 대한 전망을 알려주세요.
- 오늘의 일운과 을사년이 사업운에 미치는 영향을 구체적으로 설명해주세요.
- 사업 성공을 위해 취해야 할 행동이나 피해야 할 함정을 알려주세요.
- 사업 관련 행운을 가져올 수 있는 요소나 전략을 제안해주세요.`
        break
      case "health":
        categoryPrompt = `
## 오늘의 건강운 💪
- 건강 상태를 유지하기 위해 어떤 점을 주의해야 하는지, 어떤 활동이 도움이 될지 알려주세요.
- 특히 조심해야 할 질병이나 사고에 대한 정보를 제공해주세요.
- 오늘의 일운과 을사년이 건강운에 미치는 영향을 구체적으로 설명해주세요.
- 건강 증진을 위한 식습관이나 운동 팁을 제안해주세요.
- 건강과 관련된 행운의 요소나 활동을 알려주세요.`
        break
      default:
        categoryPrompt = `
## 오늘의 총운 🍀
- 오늘의 전반적인 운세 흐름을 한 문장으로 요약해주세요.
- 올해 을사년과 오늘의 일운이 사주에 어떤 영향을 미치는지 설명해주세요.`
    }

    // 프롬프트 업데이트: 올해 을사년과 오늘의 일운 정보 추가
    const prompt = `
사주팔자 전문가로서 다음 사주에 대한 오늘의 ${category === "love" ? "연애운" : category === "money" ? "재물운" : category === "career" ? "직업운" : category === "business" ? "사업운" : category === "health" ? "건강운" : "총운"}을 제공해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
오늘의 음력 날짜: ${lunarYearStr}년 ${lunarMonthStr}월 ${lunarDayStr}일
올해: ${currentYear}년 ${yearCycle}

- 이름: ${userName}
- 성별: ${genderText}
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시주: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

${categoryPrompt}

## 오늘의 행운의 요소 🌟
- 행운의 색상, 물건, 장소 등을 제시하여 긍정적인 기운을 높일 수 있도록 도와주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요. 적절한 이모지를 사용하여 가독성을 높여주세요.
`

    // 비스트리밍 요청 처리
    const startTime = Date.now()
    let interpretation = ""
    let responseTime = 0

    try {
      console.log("Attempting to generate text with OpenAI model")

      // OpenAI API 키 확인
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY is not defined")
        throw new Error("OpenAI API key is missing")
      }

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 3000,
        apiKey: OPENAI_API_KEY,
        system:
          "당신은 사주팔자 전문가입니다. 사주에 대한 오늘의 운세를 제공해주세요. 마크다운 형식으로 응답해주세요. 제목과 소제목을 사용하고, 내용은 구체적으로 작성해주세요. 적절한 이모지를 사용하여 가독성을 높여주세요. 올해 을사년과 오늘의 일운을 고려하여 분석해주세요.",
      })

      interpretation = text
      responseTime = Date.now() - startTime
      console.log(`OpenAI response generated in ${responseTime}ms`)

      // 응답 반환
      return NextResponse.json({
        interpretation,
        model: "openai",
        responseTime: `${responseTime}ms`,
      })
    } catch (error) {
      console.error("Error generating interpretation:", error)

      // 오류 발생 시 폴백 해석 반환
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in API route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
