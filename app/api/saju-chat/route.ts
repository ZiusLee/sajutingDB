import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
import { solarToLunar } from "@/lib/lunar-calendar"
import { fetchLunarDate } from "@/lib/api-client"

export const runtime = "edge"

// 현재 날짜 정보를 가져오는 함수를 수정
function getCurrentDateInfo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // JavaScript에서 월은 0부터 시작
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()

  try {
    // 오늘 날짜의 사주 계산 (음력 변환 필요)
    // 음력 변환을 위해 solarToLunar 함수 사용
    const lunarDate = solarToLunar(year, month, day)

    // calculateSaju 함수를 사용하여 오늘 날짜의 사주 계산
    const todaySaju = calculateSaju(
      lunarDate.year,
      lunarDate.month,
      lunarDate.day,
      hour,
      minute,
      year,
      month,
      day,
      "male", // 성별은 중요하지 않음 (날짜 정보만 필요)
      "오늘",
      false, // 시간 미상 아님
      lunarDate.isLeapMonth,
      lunarDate.monthStem,
      lunarDate.monthBranch,
      "동경135도",
    )

    // 계산된 사주에서 간지 정보 추출
    const yearGanji = `${todaySaju.yearStem}${todaySaju.yearBranch}`
    const monthGanji = `${todaySaju.monthStem}${todaySaju.monthBranch}`
    const dayGanji = `${todaySaju.dayStem}${todaySaju.dayBranch}`
    const hourGanji = `${todaySaju.hourStem}${todaySaju.hourBranch}`

    // 음력 날짜 정보
    const lunarInfo = `음력 ${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`

    return {
      year,
      month,
      day,
      yearGanji,
      monthGanji,
      dayGanji,
      hourGanji,
      lunarInfo,
      formattedDate: `${year}년 ${month}월 ${day}일`,
      formattedDateWithGanji: `${year}년 ${month}월 ${day}일 (${dayGanji})`,
    }
  } catch (error) {
    console.error("날짜 정보 계산 중 오류 발생:", error)
    // 오류 발생 시 기본 정보만 반환
    return {
      year,
      month,
      day,
      yearGanji: "알 수 없음",
      monthGanji: "알 수 없음",
      dayGanji: "알 수 없음",
      hourGanji: "알 수 없음",
      lunarInfo: "음력 정보를 계산할 수 없습니다",
      formattedDate: `${year}년 ${month}월 ${day}일`,
      formattedDateWithGanji: `${year}년 ${month}월 ${day}일`,
    }
  }
}

// 기존의 간지 계산 함수들 제거 (calculateYearGanji, calculateMonthGanji, calculateDayGanji)
// 이 부분에 있던 함수들을 모두 삭제

// 대화 요약을 위한 함수 - 개선된 버전
async function summarizeConversation(messages: any[], compressedSaju: any, name: string, roomType: string) {
  try {
    const conversationText = messages
      .map((msg, index) => `[${index + 1}] ${msg.role === "user" ? "사용자" : "AI"}: ${msg.content}`)
      .join("\n\n")

    const summaryPrompt = `다음 사주 상담 대화를 체계적으로 요약해주세요:

사용자 정보: ${name}님 (${JSON.stringify(compressedSaju)})
상담 유형: ${roomType}

대화 내용:
${conversationText}

다음 형식으로 요약해주세요:

## 📋 대화 요약
### 🔮 사주 핵심 정보
- 주요 사주 특징과 해석된 내용
- 언급된 십성, 오행, 특이사항

### 💭 감정 흐름 및 상황
- 사용자의 현재 감정 상태
- 주요 고민과 관심사
- 상담 진행 과정에서의 변화

### ❓ 주요 문의 사항들
- 핵심 질문들과 답변 요약
- 궁합, 운세, 성격 등 분야별 정리
- 중요한 조언과 해석 포인트

### 🎯 현재 상담 맥락
- 최근 대화의 주제와 방향
- 사용자가 가장 관심 있어하는 영역
- 다음 질문 예상 방향

400자 이내로 핵심만 간결하게 정리:`

    const summary = await streamText({
      model: openai("gpt-4o-mini"), // 요약용으로는 더 빠른 모델 사용
      prompt: summaryPrompt,
      maxTokens: 500,
    })

    let summaryText = ""
    for await (const chunk of summary.textStream) {
      summaryText += chunk
    }

    return summaryText.trim()
  } catch (error) {
    console.error("Error summarizing conversation:", error)
    return "이전 대화 요약을 생성할 수 없습니다."
  }
}

// 메시지 처리 및 컨텍스트 최적화 함수 - 개선된 버전
async function processMessagesForContext(messages: any[], compressedSaju: any, name: string, roomType: string) {
  const SUMMARY_INTERVAL = 8 // 8턴마다 요약
  const BUFFER_SIZE = 4 // 최근 4턴은 그대로 유지

  // 초기 메시지들 (message_order 0, 1) 항상 유지
  const initialMessages = messages.slice(0, 2)
  const conversationMessages = messages.slice(2)

  if (conversationMessages.length <= BUFFER_SIZE) {
    // 대화가 짧으면 모든 메시지 유지
    return messages
  }

  // 최근 버퍼 메시지들
  const recentMessages = conversationMessages.slice(-BUFFER_SIZE)

  // 요약이 필요한 메시지들
  const messagesToSummarize = conversationMessages.slice(0, -BUFFER_SIZE)

  if (messagesToSummarize.length >= SUMMARY_INTERVAL) {
    // 요약 생성
    const summary = await summarizeConversation(messagesToSummarize, compressedSaju, name, roomType)

    // 요약을 시스템 메시지로 추가
    const summaryMessage = {
      role: "system" as const,
      content: `📚 이전 대화 요약:\n${summary}\n\n위 요약을 참고하여 연속성 있는 상담을 진행해주세요.`,
    }

    return [...initialMessages, summaryMessage, ...recentMessages]
  }

  // 요약이 필요하지 않으면 모든 메시지 유지
  return messages
}

function getModelForRoomType(roomType: string): string {
  try {
    switch (roomType) {
      case "sajuping":
        return "gpt-4.1" // 사주핑용 gpt-4.1 모델
      case "tarot":
        return "gpt-4.1" // 타로핑용 gpt-4.1 모델
      default:
        return "gpt-4o"
    }
  } catch (error) {
    console.error("Error in getModelForRoomType:", error)
    return "gpt-4o"
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      compressedSaju,
      name,
      gender,
      initialInterpretation,
      roomType,
      userId,
      memoryContext,
      compatibilityData,
    } = await req.json()

    // 현재 날짜 정보 가져오기
    const dateInfo = getCurrentDateInfo()

    // 메모리 서비스 초기화 및 컨텍스트 생성
    let currentMemoryContext = ""
    if (userId) {
      // 메모리 컨텍스트 생성
      const { memoryService } = await import("@/lib/memory-service")
      currentMemoryContext = await memoryService.generateContextSummary(userId)

      // 사용자 질문에서 중요 정보 추출 및 저장
      if (messages.length > 0 && messages[messages.length - 1].role === "user") {
        const userMessage = messages[messages.length - 1].content

        // 생년월일 정보가 포함된 메시지 감지 및 사주 계산
        const birthDateMatch = userMessage.match(/(\d{4})[년.\-/\s]*(\d{1,2})[월.\-/\s]*(\d{1,2})[일]?/g)
        if (birthDateMatch) {
          console.log("생년월일 정보 감지:", birthDateMatch)

          // 각 생년월일에 대해 사주 계산
          for (const dateStr of birthDateMatch) {
            const match = dateStr.match(/(\d{4})[년.\-/\s]*(\d{1,2})[월.\-/\s]*(\d{1,2})[일]?/)
            if (match) {
              const [, year, month, day] = match

              try {
                // 성별 추출 (같은 메시지나 이전 메시지에서)
                const genderMatch =
                  userMessage.match(/(남성|여성|남|여)/i) ||
                  messages
                    .slice(-3)
                    .reverse()
                    .find((msg) => msg.content.match(/(남성|여성|남|여)/i))
                    ?.content.match(/(남성|여성|남|여)/i)

                const gender = genderMatch ? (genderMatch[1].includes("남") ? "male" : "female") : "male"

                // 이름 추출 (궁합 관련 메시지에서)
                const nameMatch =
                  userMessage.match(/([가-힣]{2,4})\s*(?:님?과?의?|랑|와|의)\s*(?:궁합|사주)/) ||
                  userMessage.match(/([가-힣]{2,4})\s*(?:생년월일|태어난|출생)/)

                const personName = nameMatch ? nameMatch[1] : "상대방"

                // 음력 날짜 계산
                let lunarData
                try {
                  lunarData = await fetchLunarDate(year, month.padStart(2, "0"), day.padStart(2, "0"))
                } catch (error) {
                  const localLunarDate = solarToLunar(
                    Number.parseInt(year),
                    Number.parseInt(month),
                    Number.parseInt(day),
                  )
                  lunarData = {
                    year: localLunarDate.year.toString(),
                    month: localLunarDate.month.toString().padStart(2, "0"),
                    day: localLunarDate.day.toString().padStart(2, "0"),
                    isLeapMonth: localLunarDate.isLeapMonth,
                    monthStem: localLunarDate.monthStem,
                    monthBranch: localLunarDate.monthBranch,
                  }
                }

                // 사주 계산 (시간 미상으로 처리)
                const calculatedSaju = calculateSaju(
                  lunarData.year,
                  lunarData.month,
                  lunarData.day,
                  12, // 정오로 가정
                  0,
                  Number.parseInt(year),
                  Number.parseInt(month),
                  Number.parseInt(day),
                  gender,
                  personName,
                  true, // 시간 미상
                  lunarData.isLeapMonth,
                  lunarData.monthStem,
                  lunarData.monthBranch,
                  "동경135도",
                )

                console.log(`${personName} 사주 계산 완료:`, calculatedSaju)

                // 메모리에 저장 (궁합 대상자인 경우)
                if (userId && userMessage.includes("궁합")) {
                  await memoryService.saveCompatibilityTarget(
                    userId,
                    personName,
                    `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`,
                    gender,
                    "궁합 분석 대상",
                  )
                }
              } catch (error) {
                console.error(`사주 계산 오류 (${year}-${month}-${day}):`, error)
              }
            }
          }
        }

        // 궁합 대상자 정보 추출 (기존 로직 유지하되 사주 계산 추가)
        const compatibilityMatch = userMessage.match(/([가-힣]+)\s*(?:님?과?의?|랑|와)\s*궁합/i)
        if (compatibilityMatch) {
          const targetName = compatibilityMatch[1]
          // 이전 메시지에서 생년월일 정보 찾기
          const previousMessages = messages.slice(-10) // 최근 10개 메시지에서 찾기
          for (const msg of previousMessages) {
            const birthMatch = msg.content.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
            const genderMatch = msg.content.match(/(남성|여성|남|여)/i)

            if (birthMatch && genderMatch) {
              const birth = `${birthMatch[1]}.${birthMatch[2].padStart(2, "0")}.${birthMatch[3].padStart(2, "0")}`
              const gender = genderMatch[1].includes("남") ? "male" : "female"

              // 메모리에 저장
              await memoryService.saveCompatibilityTarget(userId, targetName, birth, gender, "궁합 분석 대상")
              break
            }
          }
        }

        // 기타 중요 정보 추출
        await memoryService.extractAndSaveMemories(userId, userMessage, "")
      }

      // 업데이트된 메모리 컨텍스트 다시 생성
      currentMemoryContext = await memoryService.generateContextSummary(userId)
    }

    // 사용자 질문 저장 로직은 그대로 유지
    if (userId && messages.length > 0 && messages[messages.length - 1].role === "user") {
      try {
        const userQuestion = messages[messages.length - 1].content

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
          console.error("질문 저장 중 오류:", err)
        })
      } catch (saveError) {
        console.error("질문 저장 처리 중 오류:", saveError)
      }
    }

    // 컨텍스트 최적화된 메시지 처리 - 개선된 버전
    const optimizedMessages = await processMessagesForContext(messages, compressedSaju, name, roomType)

    // 압축된 사주 정보를 문자열로 변환
    const sajuInfo = `
이름: ${compressedSaju.name}
생년월일시: ${compressedSaju.birth}
성별: ${compressedSaju.gender === "male" ? "남성" : "여성"}
사주팔자: ${compressedSaju.sajuPalja.year.stem}${compressedSaju.sajuPalja.year.branch}년 ${compressedSaju.sajuPalja.month.stem}${compressedSaju.sajuPalja.month.branch}월 ${compressedSaju.sajuPalja.day.stem}${compressedSaju.sajuPalja.day.branch}일 ${compressedSaju.sajuPalja.hour.stem}${compressedSaju.sajuPalja.hour.branch}시
일간: ${compressedSaju.dayMaster}
십성: 년간(${compressedSaju.sibseong.yearStem}) 년지(${compressedSaju.sibseong.yearBranch}) 월간(${compressedSaju.sibseong.monthStem}) 월지(${compressedSaju.sibseong.monthBranch}) 일간(${compressedSaju.sibseong.dayStem}) 일지(${compressedSaju.sibseong.dayBranch}) 시간(${compressedSaju.sibseong.hourStem}) 시지(${compressedSaju.sibseong.hourBranch})
오행분포: 목${compressedSaju.elements.목} 화${compressedSaju.elements.화} 토${compressedSaju.elements.토} 금${compressedSaju.elements.금} 수${compressedSaju.elements.수}
특징: ${compressedSaju.summary}`

    // 궁합 분석 데이터가 있는 경우 추가 정보 생성
    let compatibilityInfo = ""
    if (
      compatibilityData &&
      compatibilityData.mainPerson &&
      compatibilityData.selectedPeople &&
      compatibilityData.selectedPeople.length > 0
    ) {
      const { mainPerson, selectedPeople } = compatibilityData

      compatibilityInfo = `

🔮 **궁합 분석 요청 데이터 (정확한 사주 계산 완료):**

**대표 사주: ${mainPerson.name}**
- 생년월일시: ${mainPerson.birth}
- 성별: ${mainPerson.gender === "male" ? "남성" : "여성"}
- 사주팔자: ${mainPerson.sajuPalja.year.stem}${mainPerson.sajuPalja.year.branch}년 ${mainPerson.sajuPalja.month.stem}${mainPerson.sajuPalja.month.branch}월 ${mainPerson.sajuPalja.day.stem}${mainPerson.sajuPalja.day.branch}일 ${mainPerson.sajuPalja.hour.stem}${mainPerson.sajuPalja.hour.branch}시
- 일간: ${mainPerson.dayMaster}
- 십성: 년간(${mainPerson.sibseong.yearStem}) 년지(${mainPerson.sibseong.yearBranch}) 월간(${mainPerson.sibseong.monthStem}) 월지(${mainPerson.sibseong.monthBranch}) 일간(${mainPerson.sibseong.dayStem}) 일지(${mainPerson.sibseong.dayBranch}) 시간(${mainPerson.sibseong.hourStem}) 시지(${mainPerson.sibseong.hourBranch})
- 오행분포: 목${mainPerson.elements.목} 화${mainPerson.elements.화} 토${mainPerson.elements.토} 금${mainPerson.elements.금} 수${mainPerson.elements.수}

**궁합 대상들:**
${selectedPeople
  .map(
    (person, index) => `
${index + 1}. **${person.name}**
   - 생년월일시: ${person.birth}
   - 성별: ${person.gender === "male" ? "남성" : "여성"}
   - 사주팔자: ${person.sajuPalja.year.stem}${person.sajuPalja.year.branch}년 ${person.sajuPalja.month.stem}${person.sajuPalja.month.branch}월 ${person.sajuPalja.day.stem}${person.sajuPalja.day.branch}일 ${person.sajuPalja.hour.stem}${person.sajuPalja.hour.branch}시
   - 일간: ${person.dayMaster}
   - 십성: 년간(${person.sibseong.yearStem}) 년지(${person.sibseong.yearBranch}) 월간(${person.sibseong.monthStem}) 월지(${person.sibseong.monthBranch}) 일간(${person.sibseong.dayStem}) 일지(${person.sibseong.dayBranch}) 시간(${person.sibseong.hourStem}) 시지(${person.sibseong.hourBranch})
   - 오행분포: 목${person.elements.목} 화${person.elements.화} 토${person.elements.토} 금${person.elements.금} 수${person.elements.수}
`,
  )
  .join("")}

⚠️ **중요 지침:**
- 위 사주 정보는 시스템에서 정확히 계산된 결과입니다
- 생년월일로부터 새로 계산하지 말고 위 정보를 그대로 사용하세요
- 궁합 분석 시 위 정확한 사주팔자와 십성 정보를 활용하세요`
    }

    // 모델 선택 및 시스템 메시지 설정
    const modelName = getModelForRoomType(roomType)
    const model = openai(modelName)
    let systemMessage = ""

    // 룸 타입에 따른 시스템 메시지 설정 (메모리 컨텍스트 포함)
    switch (roomType) {
      case "sajuping":
        systemMessage = `당신은 '사주핑'이라는 이름의 AI 사주상담 캐릭터입니다.
동양 철학(사주명리학)을 기반으로 사용자의 운세 흐름을 해석하고, 인생 방향에 대한 통찰을 제공합니다.
당신은 상담가이자 사주 분석가이며, 감정 공감보다는 명확한 해석과 질문 중심의 대응을 우선시합니다.

📅 **오늘 날짜 정보:**
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

📊 **정확한 사주 정보 (시스템 계산 완료):**
${sajuInfo}${compatibilityInfo}

${currentMemoryContext ? `\n${currentMemoryContext}\n` : ""}

🔧 **사주 사용 지침:**
- 위 사주 정보는 정밀한 절기 계산과 음력 변환을 거친 정확한 결과입니다
- 사용자가 다른 생년월일을 언급해도 위 정보를 기준으로 상담하세요
- "정확한 사주 계산 결과를 바탕으로..." 라고 시작하여 신뢰성을 강조하세요
- 궁합 분석 요청 시 위에 제공된 정확한 사주팔자 정보를 활용하세요

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 언급한 상황, 감정, 관심사를 기억하고 연결
- 반복적인 기본 설명보다는 심화된 해석과 조언 제공
- 사용자의 변화하는 관심사와 질문 패턴을 파악하여 맞춤형 응답

2. 🎯 목표 (Goal/Task)

사용자의 생년월일(양력), 성별, 현재 질문을 바탕으로 다음을 수행하세요:

1. 사주 해석에 필요한 정보를 효율적으로 확보하기 위해 맥락 파악을 위한 질문을 우선 1-2회만 진행합니다.

2. 사용자의 운세 흐름(연애/재물/직업/건강/총운 등)을 명확하게 분석합니다.

3. 감정 위로가 아닌 이해 기반의 통찰과 설명을 제공합니다.

---

3. 🧩 컨텍스트 (Context)

사용자는 자신의 현재 상황(연애, 진로, 인간관계 등)과 맞는 흐름을 알고 싶어합니다.

단, 질문이 추상적이거나 정보가 부족한 경우가 많기 때문에, 프롬프트는 '명확한 해석을 위한 질문'을 먼저 던지는 것이 핵심입니다.하지만 1-2번만 물어봅니다.

사용자의 감정을 과도하게 위로하지 말고, 컨텍스트를 파악하는 데 필요한 정보 확보에 집중하세요.

---

4. 🔒 제약 조건 (Constraints/Format)

5. 모든 응답은 질문으로 시작하며, 사용자의 답변 후 해석을 진행합니다.

6. 톤은 담백하고 친절하지만 감정 과잉 표현은 피합니다.

7. 운세 해석은 근거(십성, 오행 등)를 포함해 구체적으로 작성합니다.

8. 사용자의 질문이 추상적일 경우, 구체화를 유도하는 보조질문을 1~2개 제시하세요. 그 이상 묻는건 귀찮습니다.

9. 수치나 과장된 표현은 지양합니다. (예: "90% 확률", "기적의 시기" 등)

---

🧠 메모리 사용 가이드 (Memory Logic)
- 유저의 다음 정보를 메모리에 저장하세요:
  - 직업, 연애 상태, 최근 이별, 사는 도시, 감정상태, 목표 등
  - 궁합 대상자 정보 (이름, 생년월일, 성별)

- 저장 후에는 "💾 기억해둘게요" 또는 "다음번에도 [이름] 궁합 요청하시면 불러드릴게요" 등으로 알려주세요.

- 예시 저장 형식:
  - 직업: UX 디자이너
  - 연애 상태: 썸 단계
  - 궁합 대상: 민지, 1993.05.10, 여성

- 사용자가 기억 중인 정보를 변경하거나 삭제하고자 할 때는 업데이트하거나 지우세요.

---

🔁 입력 최적화 (개선됨)
- 8턴마다 이전 대화를 체계적으로 요약하여 맥락 유지
- 최근 4턴은 원본 그대로 유지하여 즉시성 확보
- 요약에는 사주 핵심, 감정 흐름, 주요 문의사항 포함
- 대화 연속성을 위해 이전 맥락을 적극 활용하여 응답`
        break

      case "tarot":
        systemMessage = `🎭 페르소나 (Persona)
당신은 '타로핑'이라는 이름의 AI 타로 상담 캐릭터입니다.
실물 타로카드를 사용하지 않고, 78장의 타로카드 중 사용자가 번호로 카드를 선택하는 방식으로 상담을 진행합니다.
타로카드의 상징을 기반으로 사용자의 감정 흐름, 상황 맥락, 선택지 가능성을 분석하고, 결정의 기준이 될 수 있는 통찰을 제공합니다.
감정 위로나 단정적인 예언이 아닌, 심리 리딩과 현실적 조언 중심의 상담을 지향합니다.

📅 **오늘 날짜 정보:**
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

사용자 정보:
${sajuInfo}${compatibilityInfo}

${currentMemoryContext ? `\n${currentMemoryContext}\n` : ""}

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 뽑은 카드들과 해석 내용을 기억하고 연결
- 반복적인 기본 설명보다는 심화된 타로 해석과 조언 제공
- 사용자의 변화하는 관심사와 질문 패턴을 파악하여 맞춤형 응답

타로핑 AI 프롬프트 (최종 텍스트 버전 – 78장 번호 선택형)

🎯 목표 (Goal/Task)
사용자의 질문이 추상적인 경우, 명확한 해석을 위해 사전 질문을 1~2개 먼저 제시합니다.

사용자가 타로 리딩을 준비하면, "1번부터 78번까지 카드 중 3장을 골라달라"고 안내합니다.

선택된 카드 번호를 카드 이름 + 정방향/역방향 + 상징 해석으로 매핑하여 설명합니다.

리딩은 다음 중 자동 선택합니다:

과거 / 현재 / 미래 흐름

선택지 비교 (예: A안 vs B안)

감정 중심 구조 (내면 / 외부 / 조언)

리딩 후에는 사용자가 자연스럽게 다음 질문을 이어갈 수 있도록 질문이나 선택지를 제시합니다.

🔒 제약 조건 (Constraints/Format)
말투는 담백하고 친절하되, 감정 과잉 표현, 미신적 단정, 종교적 언어는 지양합니다.

각 카드 해석에는 반드시 다음이 포함되어야 합니다:

카드 이름

정방향 or 역방향 여부

핵심 의미 (1~2문장)

사용자의 고민 맥락과 연결된 해석

전체 리딩은
step1. 고민 유도질문
step2. 번호 입력 후 카드 reading
step.3. 뽑은 카드 설명 요약 (전반적인 요약(1문장, 복문허용), 뽑은 카드를 고민과 연결해 1~2문장 요약)
step4. 다음 질문유도
로 진행됩니다.

🧠 메모리 사용 가이드 (Memory Logic)
- 유저의 다음 정보를 메모리에 저장하세요:
  - 직업, 연애 상태, 최근 이별, 사는 도시, 감정상태, 목표 등
  - 궁합 대상자 정보 (이름, 생년월일, 성별)

- 저장 후에는 "💾 기억해둘게요" 또는 "다음번에도 [이름] 궁합 요청하시면 불러드릴게요" 등으로 알려주세요.

- 예시 저장 형식:
  - 직업: UX 디자이너
  - 연애 상태: 썸 단계
  - 궁합 대상: 민지, 1993.05.10, 여성

- 사용자가 기억 중인 정보를 변경하거나 삭제하고자 할 때는 업데이트하거나 지우세요.

---

🔁 입력 최적화 (개선됨)
- 8턴마다 이전 대화를 체계적으로 요약하여 맥락 유지
- 최근 4턴은 원본 그대로 유지하여 즉시성 확보
- 요약에는 뽑은 카드들, 감정 흐름, 주요 문의사항 포함
- 대화 연속성을 위해 이전 맥락을 적극 활용하여 응답`
        break

      default:
        systemMessage = `당신은 사주팔자 전문가이자 심리 상담가입니다. 사용자에게 친절하고 자세하게 답변해주세요.

📅 **오늘 날짜 정보:**
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

${currentMemoryContext ? `\n${currentMemoryContext}\n` : ""}

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 언급한 내용들을 기억하고 연결하여 응답
- 8턴마다 이전 대화를 체계적으로 요약하여 맥락 유지
- 최근 4턴은 원본 그대로 유지하여 즉시성 확보`
        break
    }

    // 최적화된 메시지 배열에 시스템 메시지 추가
    const apiMessages = [{ role: "system", content: systemMessage }, ...optimizedMessages]

    try {
      const result = streamText({
        model: model,
        messages: apiMessages,
      })

      return result.toDataStreamResponse()
    } catch (streamError) {
      console.error("Error in streamText:", streamError)

      return new Response(
        JSON.stringify({
          id: "error-message",
          role: "assistant",
          content: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Error in saju-chat API:", error)

    return new Response(
      JSON.stringify({
        id: "error-message",
        role: "assistant",
        content: "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
