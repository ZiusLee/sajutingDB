"use client"

export async function getAdditionalInterpretation(
  saju: any,
  name: string,
  gender: string,
  model: string,
  questionCategory: string,
  relationshipStatus = "solo",
) {
  try {
    console.log("Requesting additional interpretation")

    const response = await fetch("/api/saju-additional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ saju, name, gender, model, questionCategory, relationshipStatus }),
    })

    if (!response.ok) {
      throw new Error("Failed to get additional interpretation")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching additional interpretation:", error)
    throw error
  }
}

export async function getCompatibilityAnalysis(userInfo: any, partnerInfo: any, relationshipStatus: string) {
  try {
    console.log("Requesting compatibility analysis")

    // 타임아웃 설정 추가
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60초 타임아웃

    try {
      const response = await fetch("/api/saju-compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userInfo, partnerInfo, relationshipStatus }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId) // 타임아웃 취소

      // 응답 상태 코드 로깅 추가
      console.log("API response status:", response.status)

      // 응답이 JSON이 아닐 경우를 대비한 처리
      const responseText = await response.text()
      console.log("API response length:", responseText.length)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing API response:", parseError)
        console.error("Response text:", responseText.substring(0, 200) + "...")
        throw new Error("Invalid JSON response")
      }

      return data
    } catch (abortError) {
      if (abortError.name === "AbortError") {
        console.error("Compatibility analysis request timed out after 60 seconds")
        return {
          fallbackInterpretation: `
# 궁합 분석 시간 초과

궁합 분석 요청 시간이 초과되었습니다.

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 인터넷 연결을 확인해보세요.
3. 잠시 후 다시 시도해보세요.
4. 서버 부하가 높을 수 있으니 한 시간 후에 다시 시도해보세요.
`,
          error: "궁합 분석 요청 시간이 초과되었습니다.",
        }
      }
      throw abortError
    }
  } catch (error) {
    console.error("Error fetching compatibility analysis:", error)
    throw error
  }
}

// Function to fetch lunar date information
export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    console.log(`Fetching lunar date for ${year}-${month}-${day}`)
    const response = await fetch(`/api/lunar-date?year=${year}&month=${month}&day=${day}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch lunar date: ${response.statusText}`)
    }

    const lunarData = await response.json()
    console.log("Lunar data response:", lunarData)
    return lunarData
  } catch (error) {
    console.error("Error fetching lunar date:", error)
    throw error
  }
}

export async function getSajuInterpretation(
  saju: any,
  name?: string,
  gender?: string,
  relationshipStatus?: string,
  questionSet?: string | null,
): Promise<any> {
  try {
    console.log("Requesting saju interpretation with params:", {
      name,
      gender,
      relationshipStatus,
      questionSet,
    })

    // 타임아웃 설정 추가 (90초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000)

    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        saju,
        name,
        gender,
        relationshipStatus,
        questionSet,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // 응답 상태 코드 로깅 추가
    console.log("API response status:", response.status)

    // 응답이 JSON이 아닐 경우를 대비한 처리
    const responseText = await response.text()
    console.log("API response length:", responseText.length)

    if (!response.ok) {
      console.error("API response error:", response.status, responseText.substring(0, 200) + "...")

      // 서버 오류 처리 개선
      if (response.status === 504 || response.status === 500) {
        console.log("Returning fallback interpretation due to server error")
        return {
          fallbackInterpretation: `
# 사주 해석 오류

사주 해석을 가져오는 중 서버 오류가 발생했습니다.

## 기본적인 해석:
- 일주(日柱)를 중심으로 성격과 성향을 파악할 수 있습니다.
- 오행의 균형에 따라 삶의 방향성이 달라질 수 있습니다.
- 상세한 해석은 전문가와 상담하시는 것이 좋습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: 서버 오류 (${response.status})
- 오류 메시지: ${responseText.substring(0, 100)}...

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 인터넷 연결을 확인해보세요.
3. 잠시 후 다시 시도해보세요.
4. 계속 문제가 발생하면 다른 브라우저에서 시도해보세요.
`,
          error: `서버 오류: ${response.status}`,
        }
      }

      throw new Error(`API 응답 오류: ${response.status}`)
    }

    // 응답 텍스��가 비어있는지 확인
    if (!responseText || responseText.trim() === "") {
      console.error("Empty API response")
      return {
        fallbackInterpretation: `
# 사주 해석 오류

사주 해석 결과가 비어있습니다.

## 기본적인 해석:
- 일주(日柱)를 중심으로 성격과 성향을 파악할 수 있습니다.
- 오행의 균형에 따라 삶의 방향성이 달라질 수 있습니다.
- 상세한 해석은 전문가와 상담하시는 것이 좋습니다.

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 잠시 후 다시 시도해보세요.
`,
        error: "빈 응답 데이터",
      }
    }

    // JSON 파싱 시도
    try {
      const data = JSON.parse(responseText)
      return data
    } catch (parseError) {
      console.error("Error parsing API response:", parseError)
      console.error("Response text:", responseText.substring(0, 200) + "...")

      // 응답이 JSON이 아닌 경우 (HTML 오류 페이지 등)
      return {
        fallbackInterpretation: `
# 사주 해석 오류

사주 해석 결과를 처리하는 중 오류가 발생했습니다.

## 기본적인 해석:
- 일주(日柱)를 중심으로 성격과 성향을 파악할 수 있습니다.
- 오행의 균형에 따라 삶의 방향성이 달라질 수 있습니다.
- 상세한 해석은 전문가와 상담하시는 것이 좋습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: 응답 데이터 처리 오류
- 응답 데이터 일부: ${responseText.substring(0, 100)}...

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 잠시 후 다시 시도해보세요.
3. 브라우저 캐시를 지우고 다시 시도해보세요.
`,
        error: "응답 데이터 처리 오류",
      }
    }
  } catch (error) {
    console.error("Error fetching saju interpretation:", error)

    // 타임아웃 오류 처리
    if (error.name === "AbortError") {
      return {
        fallbackInterpretation: `
# 사주 해석 시간 초과

사주 해석 요청 시간이 초과되었습니다.

## 기본적인 해석:
- 일주(日柱)를 중심으로 성격과 성향을 파악할 수 있습니다.
- 오행의 균형에 따라 삶의 방향성이 달라질 수 있습니다.
- 상세한 해석은 전문가와 상담하시는 것이 좋습니다.

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 인터넷 연결을 확인해보세요.
3. 잠시 후 다시 시도해보세요.
4. 서버 부하가 높을 수 있으니 한 시간 후에 다시 시도해보세요.
`,
        error: "사주 해석 요청 시간이 초과되었습니다.",
      }
    }

    // 네트워크 오류 처리
    if (error.message && error.message.includes("fetch")) {
      return {
        fallbackInterpretation: `
# 사주 해석 네트워크 오류

사주 해석을 가져오는 중 네트워크 오류가 발생했습니다.

## 기본적인 해석:
- 일주(日柱)를 중심으로 성격과 성향을 파악할 수 있습니다.
- 오행의 균형에 따라 삶의 방향성이 달라질 수 있습니다.
- 상세한 해석은 전문가와 상담하시는 것이 좋습니다.

## 문제 해결 방법:
1. 인터넷 연결을 확인해보세요.
2. 페이지를 새로고침하고 다시 시도해보세요.
3. 잠시 후 다시 시도해보세요.
4. 다른 네트워크에서 접속해보세요.
`,
        error: "네트워크 오류",
      }
    }

    // 기타 오류 처리
    return {
      fallbackInterpretation: `
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
4. 브라우저를 업데이트하거나 다른 브라우저를 사용해보세요.
`,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    }
  }
}

// 연애운 상세 분석을 위한 API 호출 함수 추가
export async function getLoveDetailedAnalysis(saju: any, name: string, gender: string, relationshipStatus: string) {
  try {
    console.log("Requesting love detailed analysis")

    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        saju,
        name,
        gender,
        questionSet: "love-detailed",
        relationshipStatus,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get love detailed analysis")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching love detailed analysis:", error)
    throw error
  }
}
