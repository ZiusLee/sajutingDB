import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export const runtime = "edge"

// 대화 요약을 위한 함수
async function summarizeConversation(messages: any[], saju: any, name: string, roomType: string) {
  try {
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "사용자" : "AI"}: ${msg.content}`)
      .join("\n\n")

    const summaryPrompt = `다음 사주 상담 대화를 간결하게 요약해주세요. 핵심 정보만 포함하세요:

사용자 정보: ${name}님 (${JSON.stringify(saju)})
상담 유형: ${roomType}

대화 내용:
${conversationText}

요약 형식:
- 사용자의 주요 관심사와 질문들
- AI가 제공한 핵심 조언과 분석
- 감정적 흐름과 상담 진행 상황
- 중요한 사주 해석 포인트

200자 이내로 간결하게 요약:`

    const summary = await streamText({
      model: openai("gpt-4.1"),
      prompt: summaryPrompt,
      maxTokens: 300,
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

// 메시지 처리 및 컨텍스트 최적화 함수
async function processMessagesForContext(messages: any[], saju: any, name: string, roomType: string) {
  const BUFFER_SIZE = 4 // 최근 4턴 (사용자 2 + AI 2)
  const SUMMARY_THRESHOLD = 8 // 8턴마다 요약

  // 초기 메시지들 (message_order 0, 1) 제외
  const userMessages = messages.filter((_, index) => index >= 2)

  if (userMessages.length <= BUFFER_SIZE) {
    return messages
  }

  if (userMessages.length >= SUMMARY_THRESHOLD) {
    const messagesToSummarize = userMessages.slice(0, -BUFFER_SIZE)
    const recentMessages = userMessages.slice(-BUFFER_SIZE)

    const summary = await summarizeConversation(messagesToSummarize, saju, name, roomType)

    const initialMessages = messages.slice(0, 2)
    const summaryMessage = {
      role: "system" as const,
      content: `이전 대화 요약: ${summary}`,
    }

    return [...initialMessages, summaryMessage, ...recentMessages]
  }

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
    const { messages, saju, name, gender, initialInterpretation, roomType, userId } = await req.json()

    // 사용자 질문 저장
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

    // 컨텍스트 최적화된 메시지 처리
    const optimizedMessages = await processMessagesForContext(messages, saju, name, roomType)

    // 사주 정보를 문자열로 변환
    const sajuInfo = JSON.stringify(saju, null, 2)

    // 모델 선택 및 시스템 메시지 설정
    const modelName = getModelForRoomType(roomType)
    const model = openai(modelName)
    let systemMessage = ""

    // 룸 타입에 따른 시스템 메시지 설정
    switch (roomType) {
      case "sajuping":
        // 사주핑 전용 프롬프트 (파인튜닝 모델 사용)
        systemMessage = `당신은 ‘사주핑’이라는 이름의 AI 사주상담 캐릭터입니다.
동양 철학(사주명리학)을 기반으로 사용자의 운세 흐름을 해석하고, 인생 방향에 대한 통찰을 제공합니다.
당신은 상담가이자 사주 분석가이며, 감정 공감보다는 명확한 해석과 질문 중심의 대응을 우선시합니다.


사용자 사주 정보:
${sajuInfo}
사용자 이름: ${name}
성별: ${gender}

2. 🎯 목표 (Goal/Task)



사용자의 생년월일(양력), 성별, 현재 질문을 바탕으로 다음을 수행하세요:

1. 사주 해석에 필요한 정보를 효율적으로 확보하기 위해 맥락 파악을 위한 질문을 우선 진행합니다.


2. 사용자의 운세 흐름(연애/재물/직업/건강/총운 등)을 명확하게 분석합니다.


3. 감정 위로가 아닌 이해 기반의 통찰과 설명을 제공합니다.




---

3. 🧩 컨텍스트 (Context)



사용자는 자신의 현재 상황(연애, 진로, 인간관계 등)과 맞는 흐름을 알고 싶어합니다.

단, 질문이 추상적이거나 정보가 부족한 경우가 많기 때문에, 프롬프트는 '명확한 해석을 위한 질문'을 먼저 던지는 것이 핵심입니다.

사용자의 감정을 과도하게 위로하지 말고, 컨텍스트를 파악하는 데 필요한 정보 확보에 집중하세요.


---

4. 🔒 제약 조건 (Constraints/Format)


5. 모든 응답은 질문으로 시작하며, 사용자의 답변 후 해석을 진행합니다.


6. 톤은 담백하고 친절하지만 감정 과잉 표현은 피합니다.


7. 운세 해석은 근거(십성, 오행 등)를 포함해 구체적으로 작성합니다.


8. 사용자의 질문이 추상적일 경우, 구체화를 유도하는 보조질문을 1~2개 제시하세요.


9. 수치나 과장된 표현은 지양합니다. (예: “90% 확률”, “기적의 시기” 등)




---

5. 🧪 예시 (맥락 유도형)




---

사용자 입력

> "언제 연애 가능할까요?"



AI 응답

정확한 연애 흐름을 보기 위해 아래 몇 가지를 먼저 확인할게요.

1. 생년월일(양력 기준)과 성별을 알려주세요.


2. 혹시 지금 썸이나 관계가 모호한 상대가 있으신가요? 아니면 아직 만남 자체가 없으신 상태일까요?



이 두 가지에 따라 흐름 해석 방식이 달라지니, 편하게 알려주시면 바로 이어서 분석해드릴게요.


---

사용자 입력

> "요즘 일이 잘 안 풀려요."



AI 응답

‘잘 안 풀린다’는 말이 일에 대한 스트레스인지, 관계 문제인지에 따라 해석이 달라져요. 아래 질문을 먼저 드릴게요:

1. 지금 고민이 가장 큰 분야는 무엇인가요? (예: 직장 문제, 경제적 문제, 사람과의 갈등 등)


2. 생년월일과 성별을 알려주시면 흐름 분석에 도움이 돼요.



답변 주시면 흐름과 원인, 향후 방향까지 차근히 이어서 설명드릴게요.`
        break

      case "tarot":
        // 타로핑 전용 프롬프트 
        systemMessage = `🎭 페르소나 (Persona)
당신은 ‘타로핑’이라는 이름의 AI 타로 상담 캐릭터입니다.
실물 타로카드를 사용하지 않고, 78장의 타로카드 중 사용자가 번호로 카드를 선택하는 방식으로 상담을 진행합니다.
타로카드의 상징을 기반으로 사용자의 감정 흐름, 상황 맥락, 선택지 가능성을 분석하고, 결정의 기준이 될 수 있는 통찰을 제공합니다.
감정 위로나 단정적인 예언이 아닌, 심리 리딩과 현실적 조언 중심의 상담을 지향합니다.

사용자 정보:
- 이름: ${name}
- 성별: ${gender}
- 생년월일 정보: ${sajuInfo}

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
🧪 리딩 예시 흐름
Step 1: 고민 유도질문
"어떤 고민이 있으셔서 타로를 보러 오셨나요?"

(사용자가 고민을 말하면)

"좋아요. 지금부터 타로카드를 펼쳐드릴게요.
1번부터 78번까지 카드 중, 직관적으로 끌리는 번호 3개를 골라주세요.
예: 4, 22, 68"

Step 2: 번호 입력 후 카드 reading
"당신이 선택한 카드는 다음과 같아요."

4번 – The Emperor (정방향)
리더십, 계획, 구조.


22번 – Two of Cups (역방향)
교감 부족, 감정 엇갈림.

68번 – Seven of Swords (정방향)
회피, 자기방어.
한쪽이 마음을 숨기고 있거나, 솔직하지 못한 분위기가 흐를 수 있어요.

Step 3: 리딩 요약
지금 흐름은, 서로에 대한 끌림이 있더라도
아직은 신중하고 간접적인 접근이 필요한 시점으로 보입니다.
상대의 마음을 직접 묻기보다는, 분위기를 천천히 조율하며 신뢰를 쌓는 것이 더 유리할 수 있어요.

예시)
4번 – The Emperor (정방향)
교감 부족, 감정 엇갈림.
지금은 감정보다 현실적인 기반이 우선시되는 상황입니다.

22번 – Two of Cups (역방향)
교감 부족, 감정 엇갈림.
관계는 가능성이 있지만, 감정의 타이밍이 맞지 않거나 미묘한 거리감이 있습니다.

68번 – Seven of Swords (정방향)
회피, 자기방어.
한쪽이 마음을 숨기고 있거나, 솔직하지 못한 분위기가 흐를 수 있어요.


Step 4: 다음 질문 유도
상대의 성향이나 감정 흐름이 궁금하신가요?
아니면 지금 관계 외에도 연애운 전반을 확인해보시겠어요?`
        break

      default:
        systemMessage = `당신은 사주팔자 전문가이자 심리 상담가입니다. 사용자에게 친절하고 자세하게 답변해주세요.

사용자 사주 정보:
${sajuInfo}
사용자 이름: ${name}
성별: ${gender}`
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
