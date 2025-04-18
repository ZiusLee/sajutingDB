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
    const { saju, name, gender } = await request.json()

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
      `Processing daily fortune request for ${userName} (${genderText}), solar date: ${solarYear}-${solarMonth}-${solarDay}, lunar date: ${lunarYearStr}-${lunarMonthStr}-${lunarDayStr}`,
    )

    // 기본 질문 세트 (1-2번 질문)
    const prompt = `
사주팔자 전문가로서 다음 사주에 대한 오늘의 운세를 제공해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
오늘의 음력 날짜: ${lunarYearStr}년 ${lunarMonthStr}월 ${lunarDayStr}일

- 이름: ${userName}
- 성별: ${genderText}
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시주: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

다음 내용만 포함하여 해석해주세요:

## 오늘의 총운 🍀
- 오늘의 전반적인 운세 흐름을 한 문장으로 요약해주세요.

## 오늘의 애정운 💖
- 솔로인 경우: 새로운 만남이나 인연에 대한 가능성을 제시하고, 어떤 노력을 기울여야 할지 알려주세요.
- 연애 중인 경우: 현재 관계를 더욱 발전시키기 위한 팁이나 주의할 점을 알려주세요.
- 기혼인 경우: 배우자와의 관계를 더욱 돈독하게 유지하기 위한 방법이나 갈등을 예방하는 방법을 제시해주세요.

## 오늘의 재물운 💰
- 금전적인 기회가 있는지, 혹은 지출을 주의해야 할 점이 있는지 알려주세요.
- 투자나 소비와 관련된 의사 결정을 할 때 참고할 만한 사항을 제시해주세요.

## 오늘의 건강운 💪
- 건강 상태를 유지하기 위해 어떤 점을 주의해야 하는지, 어떤 활동이 도움이 될지 알려주세요.
- 특히 조심해야 할 질병이나 사고에 대한 정보를 제공해주세요.

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
          "당신은 사주팔자 전문가입니다. 사주에 대한 오늘의 운세를 제공해주세요. 마크다운 형식으로 응답해주세요. 제목과 소제목을 사용하고, 내용은 구체적으로 작성해주세요. 적절한 이모지를 사용하여 가독성을 높여주세요.",
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
