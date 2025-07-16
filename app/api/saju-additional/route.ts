import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { deepseek } from "@ai-sdk/deepseek"

// API 라우트의 타임아웃 설정을 60초로 변경
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log("Received additional interpretation request")
    const {
      saju,
      name,
      gender,
      model = "deepseek",
      questionCategory,
      relationshipStatus = "solo",
    } = await request.json()

    if (!saju) {
      console.error("Missing saju data in request")
      return NextResponse.json({ error: "Missing saju data" }, { status: 400 })
    }

    if (!questionCategory) {
      console.error("Missing questionCategory in request")
      return NextResponse.json({ error: "Missing questionCategory" }, { status: 400 })
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
      `Processing additional request for ${userName} (${genderText}), model: ${model}, category: ${questionCategory}, relationshipStatus: ${relationshipStatus}`,
    )

    // 관계 상태에 따른 추가 분석 지침
    let relationshipContext = ""

    switch (relationshipStatus) {
      case "solo":
        relationshipContext = `현재 솔로 상태인 ${userName}님에게 적합한 연애 전략과 조언을 제공해주세요.`
        break
      case "flirting":
        relationshipContext = `현재 썸 단계에 있는 ${userName}님에게 관계 발전을 위한 전략과 조언을 제공해주세요.`
        break
      case "dating":
        relationshipContext = `현재 연애 중인 ${userName}님에게 관계 유지와 발전을 위한 전략과 조언을 제공해주세요.`
        break
      case "married":
        relationshipContext = `현재 결혼 중인 ${userName}님에게 배우자와의 관계 개선과 유지를 위한 전략과 조언을 제공해주세요.`
        break
      default:
        relationshipContext = `${userName}님에게 적합한 연애 전략과 조언을 제공해주세요.`
        break
    }

    // 질문 카테고리에 따른 프롬프트 선택
    let prompt = ""

    if (questionCategory === "solo-analysis") {
      // 솔로 원인분석
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 솔로 원인분석을 해석해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}

- 이름: ${userName}
- 성별: ${genderText}
- 현재 관계 상태: 솔로
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시���: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 ${genderText} 솔로 원인분석: [전체 내용을 관통하는 핵심 주제]

### 1. 일주의 기본 성향이 현재 나의 연애/관계 방식에 어떤 영향을 미치고 있나?
- 내 사주팔자에 나타난 일주의 특성이 연애 방식에 미치는 영향
- 내 사주에 있는 상관, 식신, 정관, 편관 중 어떤 요소가 있고, 그것이 어떤 영향을 주는지 분석

### 2. 2025년 을사년 세운이 나의 관계 운에 어떤 내적 갈등을 유발하는가?
- 을사년의 천간/지지가 내 사주와 어떻게 상호작용하는지
- 이로 인해 발생하는 내적 갈등과 그 영향

### 3. 어떤 심리적 요인 때문에 연애에서 반복적으로 어려움을 겪는가?
- 내 사주에서 나타나는 심리적 패턴과 반복되는 문제점
- 이러한 패턴이 연애에 미치는 영향

### 4. 내 사주에 있는 기운(상관, 식신, 정관, 편관 중 해당되는 것)이 있음에도 연애나 결혼이 잘 안 풀리는 이유는?
- 내 사주에 있는 긍정적 요소들과 그것이 제대로 발현되지 못하는 이유
- 이를 방해하는 사주적 요소 분석

### 5. 특정 인연(혹은 사건)이 왔을 때 놓치게 되는 사주적 심리적 이유는?
- 좋은 인연이 와도 연결되지 못하는 사주적, 심리적 원인
- 이러한 패턴을 극복하기 위한 방법

### 6. 결론 및 실천적 조언
- 이 사람이 을사년 연애운을 실현 가능하게 하려면 어떤 마인드셋과 태도 변화가 필요한지 조언해주세요.
- 구체적 상황에 적용 가능한 실천적 방향을 제시해주세요.

중요: 제목에는 반드시 이 사람의 솔로 상태를 관통하는 핵심 주제나 원인을 한 문장으로 명확하게 표현해주세요.
예시: "${dayStem}${dayBranch}일주 ${genderText} 솔로 원인분석: 완벽주의적 성향이 만드는 관계 장벽"

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory === "flirting-strategy") {
      // 썸에서 연애로 발전시키는 전략
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 썸에서 연애로 발전시키는 전략을 해석해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}

- 이름: ${userName}
- 성별: ${genderText}
- 현재 관계 상태: 썸타��� 중
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시주: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 썸 발전 전략: [전체 내용을 관통하는 핵심 주제]

### 1. 현재 썸 관계의 사주적 분석
- 현재 썸 단계에서의 사주적 특성과 장단점
- 상대방과의 관계에서 나타나는 사주적 특징

### 2. 2025년 을사년의 연애 기운 분석
- 을사년의 천간/지지가 썸 관계에 미치는 영향
- 연애로 발전할 수 있는 시기와 기회

### 3. 썸에서 연애로 발전시키기 위한 전략
- 사주 특성을 고려한 관계 발전 전략
- 상대방의 마음을 얻기 위한 구체적인 방법

### 4. 주의해야 할 점과 극복 방법
- 사주에서 나타나는 관계 발전의 장애물
- 이를 극복하기 위한 실천적 방법

### 5. 결론 및 실천적 조언
- 썸에서 연애로 발전시키기 위한 핵심 포인트
- 구체적인 행동 지침과 마인드셋

중요: 제목에는 반드시 이 사람의 썸 관계를 관통하는 핵심 주제나 전략을 한 문장으로 명확하게 표현해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory === "marriage-issues") {
      // 결혼생활의 문제 & 해결책
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 결혼생활의 문제와 해결책에 대해 해석해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}

- 이름: ${userName}
- 성별: ${genderText}
- 현재 관계 상태: 결혼 중
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시주: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 결혼생활 문제 해결책: [전체 내용을 관통하는 핵심 주제]

### 1. 결혼생활에서의 사주적 특성
- 결혼생활에서 나타나는 사주의 장단점
- 배우자와의 관계에서 발생할 수 있는 문제점

### 2. 주요 갈등 요인 분석
- 사주에서 나타나는 주요 갈등 요인
- 배우자와의 소통 방식에서 발생하는 문제

### 3. 결혼생활 개선을 위한 전략
- 사주 특성을 고려한 결혼생활 개선 방법
- 배우자와의 관계를 더 깊게 발전시키는 방법

### 4. 2025년 을사년의 결혼운 분석
- 을사년의 천간/지지가 결혼생활에 미치는 영향
- 결혼생활이 좋아질 수 있는 시기와 기회

### 5. 결론 및 실천적 조언
- 행복한 결혼생활을 위한 핵심 포인트
- 구체적인 행동 지침과 마인드셋

중요: 제목에는 반드시 이 사람의 결혼생활 문제를 관통하는 핵심 주제나 해결책을 한 문장으로 명확하게 표현해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory === "marriage-strategy") {
      // 사주를 활용한 결혼생활 전략
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 결혼생활 전략에 대해 해석해주세요:

오늘 날짜: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}

- 이름: ${userName}
- 성별: ${genderText}
- 현재 관계 상태: 결혼 중
- 년주: ${yearStem}${yearBranch}
- 월주: ${monthStem}${monthBranch}
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster})
- 시주: ${hourStem}${hourBranch}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements.wood}), 화(${elements.fire}), 토(${elements.earth}), 금(${elements.metal}), 수(${elements.water})

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 결혼생활 전략: [전체 내용을 관통하는 핵심 주제]

### 1. 결혼생활에서의 사주적 강점
- 결혼생활에서 활용할 수 있는 사주의 강��
- 배우자와의 관계에서 발휘되는 장점

### 2. 결혼생활 향상을 위한 전략
- 사주 특성을 고려한 결혼생활 향상 방법
- 배우자와의 관계를 더 깊게 발전시키는 방법

### 3. 배우자와의 소통 전략
- 사주 특성에 맞는 효과적인 소통 방법
- 갈등 상황에서의 대처 전략

### 4. 2025년 을사년의 결혼운 활용법
- 을사년의 천간/지지를 활용한 결혼생활 개선 방법
- 결혼생활이 좋아질 수 있는 시기와 기회 활용법

### 5. 결론 및 실천적 조언
- 행복한 결혼생활을 위한 핵심 포인트
- 구체적인 행동 지침과 마인드셋

중요: 제목에는 반드시 이 사람의 결혼생활 전략을 관통하�� 핵심 주제나 방향을 한 문장으로 명확하게 표현해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory === "relationship-issues") {
      // 3. 연애에서의 문제 & 해결책
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 연애에서의 문제와 해결책에 대해 해석해주세요:

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

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 연애 문제 해결책: [전체 내용을 관통하는 핵심 주제]

### 1. 연애에서의 문제점 분석
- 나는 연애에서 어떤 부분때문에 가장 많이 다투고, 어떻게 개선할 수 있을까? (일주 기반으로 성격 분석)
- 사주에서 나타나는 연애 관계의 주요 장애물

### 2. 2025년 을사년의 연애 기운 분석
- 을사년의 천간/지지가 연애 관계에 미치는 영향
- 연애 관계가 개선될 수 있는 시기와 �����회

### 3. 관계 개선을 위한 전략
- 사주 특성을 고려한 연애 관계 개선 방법
- 파트너와의 관계를 더 깊게 발전시키는 방법

### 4. 결혼으로 가기 위한 보완점
- 연애에서 결혼으로 가려면 어떤 부분을 보완해야할까? (나에게 부족한 오행을 고려하여 설명)
- 장기적인 관계를 위한 사주적 조언

### 5. 결론 및 실천적 조언
- 행복한 연애 관계를 위한 핵심 포인트
- 구체적인 행동 지침과 마인드셋

중요: 제목에는 반드시 이 사람의 연애 문제를 ����하는 핵심 주제나 해결책을 한 문장으로 명확하게 표현해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory === "dating-strategy") {
      // 4. 사주를 활용한 연애 전략
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 연애 전략에 대해 해석해주세요:

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

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 연애 전략: [전체 내용을 관통하는 핵심 주제]

### 1. 연애에서의 사주적 강점
- 사주를 통해 연애를 성공적으로 이끌어갈 수 있는 팁은? (일주 기반 성격 분석)
- 연애 관계에서 발휘되는 장점

### 2. 2025년 을사년의 연애운 극대화 방법
- 나의 사주에서 연애운을 극대화시키는 방법은 무엇인가? (나에게 부족한 오행을 보완하는 방법)
- 을사년의 천간/지지를 활용한 연애 기회 포착법

### 3. 연애상대와 결혼상대 구분법
- 연애상대와 결혼상대 어떻게 구분할 수 있을까? (나에게 부족한 오행을 가진 사람이 좋은 궁합임을 고려)
- 장기적인 관계를 위한 파트너 선택 기준

### 4. 단점 보완 전략
- 안정적인 연애나 행복한 결혼생활을 위해 나의 단점을 어떻게 보완할 수 있을까?
- 사주적 약점을 극복하기 위한 실천적 방법

### 5. 결론 및 실천적 조언
- 성공적인 연애를 위한 핵심 포인트
- 구체적인 행동 지침과 마인드셋

중요: 제목에는 반드시 이 사람의 연애 전략을 관통하는 핵심 주제나 방향을 한 문장으로 명확하게 표현해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory === "love-detailed-analysis") {
      // 연애운 상세 분석
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 연애운 상세 분석을 해석해주세요:

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

${relationshipContext}

다음 내용을 포함하여 해석해주세요:

## ${dayStem}${dayBranch}일주 연애운 상세 분석: [전체 내용을 관통하는 핵심 주제]

### 1. 연애 성향 및 특징
- ${dayStem}${dayBranch} 일주가 가진 연애 성향과 특징
- 사주에 나타난 연애 관련 기운(상관, 식신, 정관, 편관 등)의 영향

### 2. 이상적인 파트너 유형
- 사주 기반으로 궁합이 좋은 상대의 특징
- 나에게 부족한 오행을 보완해줄 수 있는 파트너 유형

### 3. 2025년 을사년 연애운 분석
- 을사년의 천간/지지가 연애운에 미치는 영향
- 연애운이 좋은 시기와 주의해야 할 시기

### 4. 운명적 인연의 특징
- 사주에 나타난 인연의 특징과 만남의 시기
- 운명적 인연을 알아볼 수 있는 신호

### 5. 연애 패턴과 극복 방안
- 반복되는 연애 패턴과 그 사주적 원인
- 부정적 패턴을 극복하기 위한 방법

### 6. 결론 및 실천적 조언
- 연애운을 향상시키기 위한 핵심 포인트
- 구체적인 행동 지침과 마인드셋

중요: 제목에는 반드시 이 사람의 연애운을 관통하는 핵심 주제나 특징을 한 문장으로 명확하게 표현해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else if (questionCategory.startsWith("custom:")) {
      // 5. 나만의 추가 질문
      prompt = `
사주팔자 전문가로서 다음 사주에 대한 사용자의 추가 질문에 답변해주세요:

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

${relationshipContext}

사용자 질문: ${questionCategory.split("custom:")[1] || "사주에 대한 추가 질문"}

참고: 현재는 2025년 을사년입니다. 이를 고려하여 분석해주세요.

한국어로 친절하게 설명해주세요. 마크다운 형식으로 응답해주세요.
`
    } else {
      return NextResponse.json({ error: "Invalid question category" }, { status: 400 })
    }

    // 비스트리밍 요청 처리
    const startTime = Date.now()
    let interpretation = ""
    let responseTime = 0
    const currentModel = model
    const fallbackFromOpenAI = false

    // 먼저 DeepSeek 모델 사용 시도 (기본 모델로 설정)
    try {
      console.log("Attempting to generate additional text with DeepSeek model")

      const { text } = await generateText({
        model: deepseek("deepseek-chat"),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 3000,
      })

      interpretation = text
      responseTime = Date.now() - startTime
      console.log(`DeepSeek additional response received in ${responseTime}ms`)

      return NextResponse.json({
        interpretation,
        model: "deepseek",
        responseTime: `${responseTime}ms`,
      })
    } catch (deepseekError) {
      console.error("DeepSeek API error:", deepseekError)

      // DeepSeek 실패 시 OpenAI로 폴백
      console.log("DeepSeek failed, falling back to OpenAI model")

      try {
        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt: prompt,
          temperature: 0.7,
          maxTokens: 3000,
        })

        interpretation = text
        responseTime = Date.now() - startTime
        console.log(`OpenAI additional response received in ${responseTime}ms`)

        return NextResponse.json({
          interpretation,
          model: "openai",
          responseTime: `${responseTime}ms`,
          fallbackFromDeepSeek: true,
        })
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError)
        throw new Error(`Both models failed: ${openaiError instanceof Error ? openaiError.message : "Unknown error"}`)
      }
    }
  } catch (error) {
    console.error("Error generating additional interpretation:", error)

    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error"
    console.error(`Error details: ${errorMessage}`)

    return NextResponse.json(
      {
        error: "Failed to generate additional interpretation",
        details: errorMessage,
        fallbackInterpretation: `
# 추가 해석 오류

추가 질문에 대한 해석을 가져오는 중 오류가 발생했습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: ${errorMessage}

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 잠시 후 다시 시도해보세요.
        `,
      },
      { status: 500 },
    )
  }
}
