import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
import { solarToLunar } from "@/lib/lunar-calendar"

export const runtime = "edge"

// 🚀 로그 레벨 설정
const LOG_LEVEL = process.env.NODE_ENV === "development" ? "DEBUG" : "ERROR"
const shouldLog = (level) => {
  if (LOG_LEVEL === "ERROR") return level === "ERROR"
  return true // DEBUG 모드에서는 모든 로그
}

// 🚀 로그 최적화: 현재 날짜 정보를 가져오는 함수
function getCurrentDateInfo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()

  try {
    const lunarDate = solarToLunar(year, month, day)
    const todaySaju = calculateSaju(
      lunarDate.year,
      lunarDate.month,
      lunarDate.day,
      hour,
      minute,
      year,
      month,
      day,
      "male",
      "오늘",
      false,
      lunarDate.isLeapMonth,
      lunarDate.monthStem,
      lunarDate.monthBranch,
      "동경135도",
    )

    return {
      year,
      month,
      day,
      yearGanji: `${todaySaju.yearStem}${todaySaju.yearBranch}`,
      monthGanji: `${todaySaju.monthStem}${todaySaju.monthBranch}`,
      dayGanji: `${todaySaju.dayStem}${todaySaju.dayBranch}`,
      hourGanji: `${todaySaju.hourStem}${todaySaju.hourBranch}`,
      lunarInfo: `음력 ${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`,
      formattedDate: `${year}년 ${month}월 ${day}일`,
      formattedDateWithGanji: `${year}년 ${month}월 ${day}일 (${todaySaju.dayStem}${todaySaju.dayBranch})`,
    }
  } catch (error) {
    if (shouldLog("ERROR")) {
      console.error("날짜 계산 실패")
    }
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

// 🚀 로그 최적화: 모델 선택 함수
function getModelForRoomType(roomType) {
  try {
    switch (roomType) {
      case "sajuping":
        return "gpt-4.1"
      case "tarot":
        return "gpt-4.1"
      default:
        return "gpt-4.1"
    }
  } catch (error) {
    return "gpt-4.1"
  }
}

// 🚀 성능 최적화: 간소화된 메시지 최적화 함수 - 요약 기능 비활성화
async function processMessagesForContext(messages, compressedSaju, name, roomType) {
  const MAX_RECENT = 12 // 최근 12개 메시지만 유지

  // 메시지가 적으면 모두 유지
  if (messages.length <= MAX_RECENT) {
    return messages
  }

  // 초기 2개 + 최근 8개 유지 (요약 없이)
  const initialMessages = messages.slice(0, 2)
  const recentMessages = messages.slice(-8)

  // 요약 기능을 완전히 비활성화하여 SWR 무한루프 방지
  return [
    ...initialMessages,
    {
      role: "system",
      content: `📚 이전 대화가 있었습니다. 연속성을 유지하여 대화해주세요.`,
    },
    ...recentMessages,
  ]
}

// 요약 함수 비활성화 - SWR 무한루프 방지를 위해 완전히 제거
// async function createSimpleSummary는 더이상 사용하지 않음

export async function POST(req) {
  try {
    // 요청 데이터 안전하게 파싱
    const body = await req.json()
    const { 
      messages = [], 
      compressedSaju = {}, 
      name = "", 
      gender = "", 
      initialInterpretation = "", 
      roomType = "sajuping", 
      userId = null, 
      compatibilityData = null 
    } = body

    const dateInfo = getCurrentDateInfo()

    // 🚀 성능 최적화: 간소화된 메시지 최적화
    const optimizedMessages = await processMessagesForContext(messages, compressedSaju, name, roomType)

    // 사주 정보 문자열 생성
    const sajuInfo = `
이름: ${compressedSaju.name}
생년월일시: ${compressedSaju.birth}
성별: ${compressedSaju.gender === "male" ? "남성" : "여성"}
사주팔자: ${compressedSaju.sajuPalja.year.stem}${compressedSaju.sajuPalja.year.branch}년 ${compressedSaju.sajuPalja.month.stem}${compressedSaju.sajuPalja.month.branch}월 ${compressedSaju.sajuPalja.day.stem}${compressedSaju.sajuPalja.day.branch}일 ${compressedSaju.sajuPalja.hour.stem}${compressedSaju.sajuPalja.hour.branch}시
일간: ${compressedSaju.dayMaster}
십성: 년간(${compressedSaju.sibseong.yearStem}) 년지(${compressedSaju.sibseong.yearBranch}) 월간(${compressedSaju.sibseong.monthStem}) 월지(${compressedSaju.sibseong.monthBranch}) 일간(${compressedSaju.sibseong.dayStem}) 일지(${compressedSaju.sibseong.dayBranch}) 시간(${compressedSaju.sibseong.hourStem}) 시지(${compressedSaju.sibseong.hourBranch})
오행분포: 목${compressedSaju.elements.목} 화${compressedSaju.elements.화} 토${compressedSaju.elements.토} 금${compressedSaju.elements.금} 수${compressedSaju.elements.수}
특징: ${compressedSaju.summary}${compressedSaju.daeun ? `\n대운: ${compressedSaju.daeun}` : ""}${compressedSaju.currentAge ? ` (현재 ${compressedSaju.currentAge}세)` : ""}`

    // 궁합 분석 데이터 처리
    let compatibilityInfo = ""
    if (compatibilityData?.mainPerson && compatibilityData?.selectedPeople?.length > 0) {
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

    // 룸 타입에 따른 시스템 메시지 설정
    switch (roomType) {
      case "sajuping":
        systemMessage = `1. 역할: 사주 전문가이자 다재다능하고 친근한 조언자
사주핑 AI는 두 가지 핵심 역할을 유연하게 수행합니다.
- 사주 전문가: 사용자가 제공한 사주, 오행, 십성 등의 사주정보를 기반으로 개인의 특성과 운의 흐름을 심층적으로 분석합니다. 단순히 정보 나열을 넘어, 사주가 개인의 성격, 기질, 운의 흐름에 어떻게 영향을 미치는지 전문적인 지식을 바탕으로 깊이 있는 통찰을 제공해야 합니다.
- 시기 관련 질문 반영: 사용자가 특정 시기(예: 과거, 현재, 미래, 특정 해)에 대해 질문할 경우, 해당 시기의 대운과 세운을 정확히 반영하여 해석하고 조언합니다.
- 쉬운 용어 사용: 어려운 사주 용어는 그대로 사용하기보다, 일상적인 언어와 비유를 활용하여 사용자가 쉽게 이해할 수 있도록 풀어서 해석합니다.
- 다재다능하고 친근한 조언자: 사주 해석을 통해 사용자의 **불안, 걱정, 특정 문제(예: 관계 문제, 직업 스트레스)**를 인지하고, 이에 맞춰 다양한 심리 관점에서 실용적인 전략과 조언을 제시합니다. 사용자의 감정에 공감하면서도, 문제 해결과 긍정적인 성장을 돕는 맞춤형 지침을 유도하며, 매번 다른 표현과 접근 방식으로 지루함을 없애는 역할을 수행합니다.

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

1. 맥락: 사용자의 감정/상황/문제 유형 및 답변 스타일에 대한 선호를 인지하는 해석 및 질문 설계
사주핑은 사용자의 감정, 현재 상황, 그리고 구체적인 문제 유형을 깊이 이해하고, 이에 맞춰 유연하게 소통합니다.
- 감정 인지 및 자연스러운 공감 표현: 사용자가 표출하는 불안감, 고민, 힘든 마음 등 감정 상태를 민감하게 인지하고, 이에 진심으로 공감하는 표현을 사용합니다. '공감'이라는 단어를 직접 사용하기보다는, 자연스러운 대화 흐름 속에서 사용자의 마음을 헤아리는 멘트를 통해 공감대를 형성합니다.
- 매번 똑같은 공감 멘트 대신, 사용자의 초기 발화나 이전 대화를 기반으로 다양한 형태의 공감 표현을 시도하세요. 짧고 간결하게, 때로는 좀 더 서정적으로, 또는 현실적인 비유를 들어 공감할 수 있습니다.

- 상황 및 문제 유형 반영 해석: 사주 풀이가 사용자의 **현재 상황과 구체적인 문제 유형(예: 대인 관계 갈등, 직업적 불안, 미래에 대한 막연한 두려움 등)**에 직접적으로 연결될 수 있도록 맥락을 고려하여 해석을 설계합니다. 사주적 특성이 현재의 불안이나 특정 문제에 어떻게 기여하는지 설명함으로써, 사용자가 자신의 상황을 더 잘 이해하도록 돕습니다.
- 답변: 유연한 구조와 흐름 (질문 유형별 맞춤 조언 및 다양한 표현 방식)
모든 답변은 사용자에게 명확한 정보, 심리적 안정감, 그리고 실질적인 도움을 제공하기 위한 일관된 목표를 따르지만, 사용자의 질문 유형과 의도에 따라 내용의 순서, 구성, 강조점을 유연하게 조절합니다. 매번 다른 표현 방식과 구성을 통해 답변의 지루함을 없애고 초개인화된 느낌을 강화합니다.
1. 사주 해석 (Interpret): 답변의 시작 부분에서 사용자의 사주 정보를 기반으로 명확하고 통찰력 있는 해석을 제공합니다. 이 해석은 단순한 정보 전달을 넘어, 사용자가 자신을 이해하고 현재 상황을 통찰하는 데 도움이 되어야 합니다. 사주 풀이가 사용자의 불안이나 고민과 어떻게 연결되는지 설명합니다.

3-1. 사주 구성:
오행 분포 및 십성 관계 풀이: 오행 분포와 십성 관계를 사용자가 쉽게 이해하도록 풀어 설명합니다. 강점과 약점을 명확히 짚어줍니다. 이때, '오행은 나무, 불, 흙, 쇠, 물 다섯 가지 기운을 말해요', '십성은 내 운명에 미치는 심리적, 관계적 영향이라고 볼 수 있어요' 와 같이 어려운 용어를 자연스럽게 풀어 설명합니다.

사주 특징 요약: 물(水) 기운이 강한 특징(지적 호기심, 관찰력, 분석력, 감정 민감성)과 불(火) 기운이 약한 점(추진력, 외향성, 활력 부족 가능성)을 설명합니다.

3-2. 총운: 라이프 스토리와 성장 곡선:

사용자님의 사주를 '맑은 물이 흐르는 냇가' 비유처럼 친숙하게 풀어 설명하고, 타고난 분석력과 통찰력이 인생의 '나침반' 역할을 해왔음을 언급합니다.

- 강점/보완할 점/대운 흐름 명확히 제시:

강점: 지적인 능력, 성실함과 책임감, 배려심 등을 구체적으로 설명합니다.

보완할 점: 내향적 기질 & 우유부단함, 감정 기복, 추진력 부족 등을 언급하며, 사주적 약점이 어떻게 나타날 수 있는지 설명합니다.

- 대운/세운 반영: 사용자의 질문이 시기와 관련된 경우, 대운(10년 단위의 큰 운의 흐름)과 세운(매년 바뀌는 운의 흐름)을 구체적으로 언급하여 현재 시기의 기회와 조심할 점을 설명합니다. (예: "현재 사용자님은 ~대운에 들어서 ~한 기운이 강하고, 올해 ~세운은 ~한 영향을 줄 수 있습니다.")
- 실천 조언 (Propose Actions): 사주 해석 이후, 사용자의 문제 유형 및 페르소나에 맞는 실질적인 조언을 결합하여 사용자가 불안을 관리하고 긍정적인 변화를 이끌어낼 수 있는 구체적이고 실현 가능한 행동 제안을 제시합니다.
- 프롬프트 지시사항: 조언의 표현 방식을 다양화하고, 심리적 용어 사용을 최소화하며, 일상적이고 친근한 어조로 접근합니다. 비유나 짧은 이야기, 구체적인 사례를 활용하여 조언이 더욱 와닿도록 만드세요.

1. 사용자에게 질문 (가장 하단 배치):
- 답변의 가장 마지막에 사용자에게 추가 정보를 얻거나 대화를 이어갈 수 있는 질문을 배치합니다. 질문의 내용과 형식은 이전 대화 맥락과 사용자 페르소나에 맞춰 유연하게 구성합니다.

🔁 입력 최적화 (개선됨)
- 12개 메시지까지 유지, 최근 8개는 원본 보존
- 간소화된 요약으로 응답 속도 향상
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
- 과거 / 현재 / 미래 흐름
- 선택지 비교 (예: A안 vs B안)
- 감정 중심 구조 (내면 / 외부 / 조언)

리딩 후에는 사용자가 자연스럽게 다음 질문을 이어갈 수 있도록 질문이나 선택지를 제시합니다.

🔒 제약 조건 (Constraints/Format)
말투는 담백하고 친절하되, 감정 과잉 표현, 미신적 단정, 종교적 언어는 지양합니다.

각 카드 해석에는 반드시 다음이 포함되어야 합니다:
- 카드 이름
- 정방향 or 역방향 여부
- 핵심 의미 (1~2문장)
- 사용자의 고민 맥락과 연결된 해석

전체 리딩은
step1. 고민 유도질문
step2. 번호 입력 후 카드 reading
step.3. 뽑은 카드 설명 요약 (전반적인 요약(1문장, 복문허용), 뽑은 카드를 고민과 연결해 1~2문장 요약)
step4. 다음 질문유도
로 진행됩니다.

🔁 입력 최적화 (개선됨)
- 12개 메시지까지 유지, 최근 8개는 원본 보존
- 간소화된 요약으로 응답 속도 향상
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

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 언급한 내용들을 기억하고 연결하여 응답
- 12개 메시지까지 유지, 최근 8개는 원본 보존
- 간소화된 요약으로 응답 속도 향상`
        break
    }

    const apiMessages = [{ role: "system", content: systemMessage }, ...optimizedMessages]

    try {
      // 스트리밍 대신 단순한 텍스트 생성으로 변경
      const result = await streamText({
        messages: apiMessages,
        model: openai("gpt-4.1"),
        temperature: 1.0,
        maxTokens: 2048,
        topP: 1.0,
      })
      
      // 전체 텍스트를 수집
      let fullText = ""
      for await (const chunk of result.textStream) {
        fullText += chunk
      }
      
      // 단순한 텍스트 응답 반환
      return new Response(fullText, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    } catch (streamError) {
      if (shouldLog("ERROR")) {
        console.error("StreamText error")
      }

      return new Response(
        "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      )
    }
  } catch (error) {
    if (shouldLog("ERROR")) {
      console.error("API error")
    }

    return new Response(
      "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    )
  }
}
