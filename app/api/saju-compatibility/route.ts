import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
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
    console.log("Received compatibility analysis request")
    const { userInfo, partnerInfo, model = "openai", relationshipStatus = "unknown" } = await request.json()

    if (!userInfo || !partnerInfo) {
      console.error("Missing user or partner data in request")
      return NextResponse.json({ error: "Missing user or partner data" }, { status: 400 })
    }

    // 사용자 사주 정보 추출
    const userSaju = userInfo.saju

    // 사용자 사주에 elements가 없는 경우 계산
    if (!userSaju.elements) {
      console.log("User saju elements not provided, calculating...")
      userSaju.elements = calculateElements(userSaju)
    }

    // 파트너 사주 계산
    let partnerSaju
    try {
      // 파트너의 음력 날짜 계산
      const lunarDate = solarToLunar(
        partnerInfo.year,
        Number.parseInt(partnerInfo.month),
        Number.parseInt(partnerInfo.day),
      )

      // 파트너의 사주 계산
      partnerSaju = calculateSaju(
        lunarDate.year.toString(),
        lunarDate.month.toString(),
        lunarDate.day.toString(),
        partnerInfo.hour || 12, // 시간을 모르는 경우 정오로 가정
        partnerInfo.minute || 0,
        partnerInfo.year,
        Number.parseInt(partnerInfo.month),
        Number.parseInt(partnerInfo.day),
        partnerInfo.gender,
        partnerInfo.name,
      )
    } catch (error) {
      console.error("Error calculating partner's saju:", error)
      return NextResponse.json({ error: "Failed to calculate partner's saju" }, { status: 500 })
    }

    // 파트너 사주에 elements가 없는 경우 계산
    if (!partnerSaju.elements) {
      console.log("Partner saju elements not provided, calculating...")
      partnerSaju.elements = calculateElements(partnerSaju)
    }

    // 사용자와 파트너의 정보 추출
    const userName = userInfo.name || "사용자"
    const userGender = userInfo.gender || "male"
    const partnerName = partnerInfo.name || "상대방"
    const partnerGender = partnerInfo.gender || "female"

    // 시간 정보 텍스트
    const timeInfoText = partnerInfo.timeUnknown
      ? "※ 상대방의 시간 정보가 없어 정확한 시주(時柱) 분석이 제한적입니다."
      : ""

    console.log(
      `Processing compatibility request for ${userName} and ${partnerName}, model: ${model}, relationship status: ${relationshipStatus}`,
    )

    // 오행 정보 안전하게 접근
    const userElements = userSaju.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
    const partnerElements = partnerSaju.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

    // 관계 상태에 따른 추가 분석 지침
    let relationshipGuidance = ""

    switch (relationshipStatus) {
      case "solo":
        relationshipGuidance = `
8. 솔로 상태에서의 궁합 분석
   - 두 사람이 처음 만났을 때 어떤 인상을 받을지 분석해주세요.
   - 첫 만남에서 어떤 대화 주제가 좋을지 제안해주세요.
   - 데이트를 시작하기 위한 접근 방법과 주의점을 알려주세요.
   - 서로에게 매력적으로 느껴질 수 있는 포인트를 설명해주세요.
   - 첫 데이트에 적합한 장소나 활동을 추천해주세요.
`
        break
      case "flirting":
        relationshipGuidance = `
8. 썸 타는 단계에서의 궁합 분석
   - 현재 썸 단계에서 두 사람의 궁합이 어떻게 작용하는지 분석해주세요.
   - 서로에게 더 매력적으로 다가갈 수 있는 방법을 제안해주세요.
   - 관계를 발전시키기 위해 피해야 할 행동이나 주의점을 알려주세요.
   - 상대방의 마음을 확인하기 좋은 시기와 방법을 제안해주세요.
   - 썸에서 연애로 발전할 가능성과 그 과정에서의 조언을 제공해주세요.
`
        break
      case "dating":
        relationshipGuidance = `
8. 연애 중인 상태에서의 궁합 분석
   - 현재 연애 관계에서 두 사람의 궁합이 어떻게 작용하는지 분석해주세요.
   - 서로의 사랑의 표현 방식과 그에 대한 이해 방법을 설명해주세요.
   - 연애 중 발생할 수 있는 갈등 요소와 해결 방법을 제안해주세요.
   - 관계를 더 깊고 의미있게 발전시키기 위한 방법을 알려주세요.
   - 장기적인 관계로 발전할 가능성과 그를 위한 조언을 제공해주세요.
   - 서로의 성격 차이를 이해하고 존중하는 방법을 설명해주세요.
`
        break
      case "married":
        relationshipGuidance = `
8. 결혼 관계에서의 궁합 분석
   - 결혼 생활에서 두 사람의 궁합이 어떻게 작용하는지 분석해주세요.
   - 가정 내에서 서로의 역할과 책임 분담에 대한 조언을 제공해주세요.
   - 결혼 생활에서 발생할 수 있는 갈등 요소와 해결 방법을 제안해주세요.
   - 장기적인 관계 유지를 위한 소통 방법과 습관을 알려주세요.
   - 서로의 가족 관계와의 조화를 이루는 방법을 설명해주세요.
   - 자녀 양육에 있어서 두 사람의 강점과 약점, 그리고 보완점을 분석해주세요.
   - 재정 관리와 미래 계획에 있어서 서로의 성향과 조화로운 방법을 제안해주세요.
`
        break
      default:
        relationshipGuidance = `
8. 일반적인 관계에서의 궁합 분석
   - 두 사람이 어떤 관계에서든 가장 잘 맞는 측면을 분석해주세요.
   - 친구, 연인, 동료, 가족 등 다양한 관계에서의 궁합을 설명해주세요.
   - 서로에게 가장 도움이 되는 방식과 역할을 제안해주세요.
   - 관계의 발전 가능성과 방향성에 대한 조언을 제공해주세요.
`
        break
    }

    // 궁합 분석 프롬프트
    const prompt = `
사주팔자 전문가로서 다음 두 사람의 사주 궁합을 분석해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}

## 첫 번째 사람 (${userName})
- 이름: ${userName}
- 성별: ${userGender === "male" ? "남성" : "여성"}
- 년주: ${userSaju.yearStem}${userSaju.yearBranch}
- 월주: ${userSaju.monthStem}${userSaju.monthBranch}
- 일주: ${userSaju.dayStem}${userSaju.dayBranch} (일간: ${userSaju.dayMaster})
- 시주: ${userSaju.hourStem}${userSaju.hourBranch}
- 띠: ${userSaju.yearAnimal}
- 오행 분포: 목(${userElements.wood}), 화(${userElements.fire}), 토(${userElements.earth}), 금(${userElements.metal}), 수(${userElements.water})

## 두 번째 사람 (${partnerName})
- 이름: ${partnerName}
- 성별: ${partnerGender === "male" ? "남성" : "여성"}
- 년주: ${partnerSaju.yearStem}${partnerSaju.yearBranch}
- 월주: ${partnerSaju.monthStem}${partnerSaju.monthBranch}
- 일주: ${partnerSaju.dayStem}${partnerSaju.dayBranch} (일간: ${partnerSaju.dayMaster})
- 시주: ${partnerSaju.hourStem}${partnerSaju.hourBranch}
- 띠: ${partnerSaju.yearAnimal}
- 오행 분포: 목(${partnerElements.wood}), 화(${partnerElements.fire}), 토(${partnerElements.earth}), 금(${partnerElements.metal}), 수(${partnerElements.water})
${timeInfoText}

다음 내용을 포함하여 두 사람의 궁합을 분석해주세요:

1. 일간 궁합 분석
   - 두 사람의 일간(日干)을 비교하여 궁합을 분석해주세요.
   - 일간합이 되는지 확인하고 설명해주세요. (갑+기, 을+경, 병+신, 정+임, 무+계)

2. 오행 궁합 분석
   - 두 사람의 오행 분포를 비교하고, 서로 부족한 오행을 보완해주는지 분석해주세요.
   - 상대방이 나에게 부족한 오행을 보완해주는지 구체적으로 설명해주세요.
   - 서로의 사주에 없는 오행이 상대방에게 있는지 확인하고, 이것이 어떤 영향을 주는지 설명해주세요.

3. 일주 궁합 분석
   - 두 사람의 일주(日柱)를 비교하여 궁합을 분석해주세요.
   - 일지에 있는 동물(십이지)의 상성을 설명해주세요.

4. 궁합 점수 (100점 만점)
   - 두 사람의 사주 궁합을 100점 만점으로 평가하고, 그 이유를 설명해주세요.

5. 성격 및 가치관 궁합
   - 일주(日柱)를 중심으로 두 사람의 성격 궁합을 분석해주세요.
   - 서로 다른 점과 공통점을 설명하고, 이것이 관계에 어떤 영향을 미치는지 설명해주세요.

6. 관계 발전 가능성
   - 두 사람의 관계가 발전할 가능성과 주의해야 할 점을 설명해주세요.
   - 서로의 단점을 보완하고 장점을 살릴 수 있는 방법을 제안해주세요.

7. 궁합 개선 방법
   - 두 사람의 궁합을 더 좋게 만들기 위한 구체적인 조언을 제공해주세요.

${relationshipGuidance}

궁합 분석 시 다음 원칙을 참고해주세요:
- 일간 궁합: 일간이 '합'이 되는 경우 궁합이 좋다고 해석합니다. (갑+기, 을+경, 병+신, 정+임, 무+계)
- 오행 궁합: 두 사람의 사주를 합쳐 보았을 때 목, 화, 토, 금, 수 5가지 오행이 골고루 있으면 좋은 궁합입니다.
- 일지 궁합: 태어난 날을 의미하는 일지 자리에 있는 동물의 상성을 고려합니다.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`

    // 비스트리밍 요청 처리
    const startTime = Date.now()
    let interpretation = ""
    let responseTime = 0
    let currentModel = model
    let fallbackFromOpenAI = false
    let compatibilityScore = 0

    // OpenAI API 호출
    if (currentModel === "openai") {
      try {
        console.log("Attempting to generate compatibility analysis with OpenAI model")

        // 타임아웃 설정 추가
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 50000) // 50초 타임아웃

        try {
          const { text } = await generateText({
            model: openai("gpt-4o"),
            prompt: prompt,
            temperature: 0.7,
            maxTokens: 2500,
            apiKey: OPENAI_API_KEY,
          })

          clearTimeout(timeoutId) // 타임아웃 취소

          interpretation = text
          responseTime = Date.now() - startTime
          console.log(`OpenAI compatibility analysis received in ${responseTime}ms`)
        } catch (abortError) {
          if (abortError.name === "AbortError") {
            console.error("OpenAI request timed out after 50 seconds")
            throw new Error("OpenAI request timed out")
          }
          throw abortError
        }

        // 궁합 점수 추출 시도
        try {
          const scoreMatch =
            interpretation.match(/궁합\s*점수[^\d]*(\d+)[^\d]*점/i) ||
            interpretation.match(/(\d+)[^\d]*점[^\d]*만점/i) ||
            interpretation.match(/점수[^\d]*(\d+)/i)
          if (scoreMatch && scoreMatch[1]) {
            compatibilityScore = Number.parseInt(scoreMatch[1], 10)
          }
        } catch (e) {
          console.error("Error extracting compatibility score:", e)
        }

        // 응답 시간과 함께 반환
        return NextResponse.json({
          interpretation,
          model: "openai",
          responseTime: `${responseTime}ms`,
          compatibilityScore,
          relationshipStatus,
          partnerSaju,
        })
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError)

        // Check if the error is related to quota or billing
        const errorMessage = openaiError instanceof Error ? openaiError.message : "Unknown error"
        console.error("OpenAI error details:", errorMessage)

        const isQuotaError =
          errorMessage.includes("quota") ||
          errorMessage.includes("billing") ||
          errorMessage.includes("exceeded") ||
          errorMessage.includes("rate limit")

        if (isQuotaError) {
          console.log("OpenAI quota exceeded, falling back to DeepSeek model...")
          currentModel = "deepseek"
          fallbackFromOpenAI = true
        } else {
          // 오류 응답 반환
          return NextResponse.json(
            {
              error: `OpenAI API error: ${errorMessage}`,
              fallbackInterpretation: `
# 궁합 분석 오류

궁합 분석을 가져오는 중 OpenAI API 오류가 발생했습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: ${errorMessage}

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 잠시 후 다시 시도해보세요.
3. 계속 문제가 발생하면 다른 브라우저에서 시도해보세요.
            `,
            },
            { status: 500 },
          )
        }
      }
    }

    // DeepSeek 모델 사용
    if (currentModel === "deepseek") {
      try {
        console.log(
          `Attempting to generate compatibility analysis with DeepSeek model${fallbackFromOpenAI ? " (fallback from OpenAI)" : ""}`,
        )

        // 타임아웃 설정 추가
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 50000) // 50초 타임아웃

        try {
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-3b3cde78c0224436bc60d3a293129f47",
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content:
                    "당신은 사주팔자 전문가입니다. 두 사람의 사주 궁합을 분석하고 상세한 해석을 제공해주세요. 마크다운 형식으로 응답해주세요. 제목과 소제목을 사용하고, 내용은 구체적으로 작성해주세요.",
                },
                { role: "user", content: prompt },
              ],
              stream: false,
              max_tokens: 2500,
              temperature: 0.7,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId) // 타임아웃 취소

          if (!response.ok) {
            const errorData = await response.text()
            console.error(`DeepSeek API error (${response.status}):`, errorData)
            throw new Error(`DeepSeek API error: ${response.status}`)
          }

          const data = await response.json()
          interpretation = data.choices[0].message.content
          responseTime = Date.now() - startTime
          console.log(`DeepSeek compatibility analysis received in ${responseTime}ms`)
        } catch (abortError) {
          if (abortError.name === "AbortError") {
            console.error("DeepSeek request timed out after 50 seconds")
            throw new Error("DeepSeek request timed out")
          }
          throw abortError
        }

        // 궁합 점수 추출 시도
        try {
          const scoreMatch =
            interpretation.match(/궁합\s*점수[^\d]*(\d+)[^\d]*점/i) ||
            interpretation.match(/(\d+)[^\d]*점[^\d]*만점/i) ||
            interpretation.match(/점수[^\d]*(\d+)/i)
          if (scoreMatch && scoreMatch[1]) {
            compatibilityScore = Number.parseInt(scoreMatch[1], 10)
          }
        } catch (e) {
          console.error("Error extracting compatibility score:", e)
        }

        // 응답 시간과 함께 반환
        return NextResponse.json({
          interpretation,
          model: "deepseek",
          responseTime: `${responseTime}ms`,
          fallbackFromOpenAI: fallbackFromOpenAI,
          compatibilityScore,
          relationshipStatus,
          partnerSaju,
        })
      } catch (deepseekError) {
        console.error("DeepSeek API error:", deepseekError)

        const errorMessage = deepseekError instanceof Error ? deepseekError.message : "Unknown error"
        console.error("DeepSeek error details:", errorMessage)

        // 오류 응답 반환
        return NextResponse.json(
          {
            error: `DeepSeek API error: ${errorMessage}`,
            fallbackInterpretation: `
# 궁합 분석 오류

궁합 분석을 가져오는 중 DeepSeek API 오류가 발생했습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: ${errorMessage}

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 잠시 후 다시 시도해보세요.
3. 계속 문제가 발생하면 다른 브라우저에서 시도해보세요.
          `,
          },
          { status: 500 },
        )
      }
    }

    // 여기까지 왔다면 어떤 모델도 성공하지 못한 것이므로 오류 반환
    console.error("Failed to generate compatibility analysis with any model")
    return NextResponse.json(
      {
        error: "Failed to generate compatibility analysis with any model",
        fallbackInterpretation: `
# 궁합 ���석 오류

궁합 분석을 가져오는 중 오류가 발생했습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: 모든 AI 모델에서 응답을 받지 못했습니다.

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 다른 AI 모델을 선택해보세요 (DeepSeek 또는 OpenAI).
3. 인터넷 연결을 확인해보세요.
4. 잠시 후 다시 시도해보세요.
      `,
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Error generating compatibility analysis:", error)

    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error"
    console.error(`Error details: ${errorMessage}`)

    return NextResponse.json(
      {
        error: "Failed to generate compatibility analysis",
        details: errorMessage,
        fallbackInterpretation: `
# 궁합 분석 오류

궁합 분석을 가져오는 중 오류가 발생했습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: ${errorMessage}

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 다른 AI 모델을 선택해보세요 (DeepSeek 또는 OpenAI).
3. 인터넷 연결을 확인해보세요.
4. 잠시 후 다시 시도해보세요.
        `,
      },
      { status: 500 },
    )
  }
}

// 천간과 지지에서 오행을 계산하는 함수
function calculateElements(saju) {
  // 천간과 지지의 오행 매핑
  const stemElements = {
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water",
  }

  const branchElements = {
    자: "water",
    축: "earth",
    인: "wood",
    묘: "wood",
    진: "earth",
    사: "fire",
    오: "fire",
    미: "earth",
    신: "metal",
    유: "metal",
    술: "earth",
    해: "water",
  }

  // 오행 카운트 초기화
  const elements = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  }

  // 천간의 오행 계산
  if (saju.yearStem && stemElements[saju.yearStem]) elements[stemElements[saju.yearStem]]++
  if (saju.monthStem && stemElements[saju.monthStem]) elements[stemElements[saju.monthStem]]++
  if (saju.dayStem && stemElements[saju.dayStem]) elements[stemElements[saju.dayStem]]++
  if (saju.hourStem && stemElements[saju.hourStem]) elements[stemElements[saju.hourStem]]++

  // 지지의 오행 계산
  if (saju.yearBranch && branchElements[saju.yearBranch]) elements[branchElements[saju.yearBranch]]++
  if (saju.monthBranch && branchElements[saju.monthBranch]) elements[branchElements[saju.monthBranch]]++
  if (saju.dayBranch && branchElements[saju.dayBranch]) elements[branchElements[saju.dayBranch]]++
  if (saju.hourBranch && branchElements[saju.hourBranch]) elements[branchElements[saju.hourBranch]]++

  return elements
}
