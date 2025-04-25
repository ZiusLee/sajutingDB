import { type NextRequest, NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, saju, roomType, currentYear, yearDescription, creative } = await req.json()

    // 마지막 메시지 추출
    const lastMessage = messages[messages.length - 1]

    console.log("Generating suggested questions for room type:", roomType)
    console.log("Last message:", lastMessage.content.substring(0, 50) + "...")

    // 시스템 프롬프트 구성 - 사용자가 AI에게 물어볼 질문 형식으로 변경
    const systemPrompt = `당신은 사주팔자 상담을 위한 추천 질문 생성기입니다. 
사용자의 사주 정보와 이전 대화 내용을 바탕으로 사용자가 AI에게 물어볼 만한 ${creative ? "창의적이고 적절한" : "관련된"} 질문을 생성해주세요.
현재는 ${currentYear}년 ${yearDescription}입니다.
채팅방 유형은 "${roomType}"이며, 이 유형에 맞는 질문을 생성해주세요.

중요: 
1. 질문은 반드시 사용자가 AI에게 물어보는 형식이어야 합니다. 예: "제 사주에서 가장 강한 기운은 무엇인가요?"
2. 질문은 간결하고 짧게 작성해주세요. 15자에서 25자 사이가 이상적입니다.
3. 질문은 반드시 한국어로 작성하고, 사주와 관련된 구체적인 내용을 포함해야 합니다.
4. 질문은 정확히 2개만 생성해주세요.
5. 각 질문은 반드시 물음표(?)로 끝나야 합니다.
${creative ? "6. 이전 대화에서 언급되지 않은 새로운 주제나 관점을 포함하는 질문을 생성해주세요." : ""}

질문은 간결하고 명확하게 작성해주세요. 너무 길지 않게 해주세요.`

    // 채팅방 유형별 특화 프롬프트 추가
    let typeSpecificPrompt = ""
    switch (roomType) {
      case "career":
        typeSpecificPrompt = "직업, 취업, 이직, 승진, 직장 생활 등과 관련된 질문을 생성해주세요."
        break
      case "love":
        typeSpecificPrompt = "연애, 만남, 인연, 결혼 등 애정 관계와 관련된 질문을 생성해주세요."
        break
      case "health":
        typeSpecificPrompt = "건강, 체질, 질병 예방, 건강 관리 등과 관련된 질문을 생성해주세요."
        break
      case "business":
        typeSpecificPrompt = "사업, 투자, 재테크, 재물운 등과 관련된 질문을 생성해주세요."
        break
      case "marriage":
        typeSpecificPrompt = "결혼, 부부 관계, 가정 등과 관련된 질문을 생성해주세요."
        break
      case "personalized":
        typeSpecificPrompt =
          "사용자의 사주에 맞춘 특별한 인생 방향성, 행운을 끌어당기는 방법 등과 관련된 질문을 생성해주세요."
        break
      case "daily-fortune":
        typeSpecificPrompt =
          "오늘의 운세와 관련된 질문을 생성해주세요. 예: '오늘 하루를 어떻게 보내는 것이 좋을까요?', '오늘 저에게 행운을 가져다 줄 요소는 무엇인가요?'"
        break
      default:
        typeSpecificPrompt = "사주와 관련된 일반적인 질문을 생성해주세요."
    }

    // API 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `${systemPrompt}
${typeSpecificPrompt}

중요: 질문은 간결하게 작성해주세요. 15-25자 정도가 적당합니다.`,
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content:
            "위 대화를 바탕으로 사용자가 AI에게 물어볼 만한 짧고 간결한 질문 2개를 생성해주세요. 각 질문은 15-25자 정도로 간결하게 작성해주세요. 질문만 나열해주세요.",
        },
      ],
      temperature: creative ? 0.9 : 0.7, // 창의적인 질문을 위해 temperature 높임
    })

    // 응답 파싱
    const content = response.choices[0].message.content || ""
    console.log("Raw AI response:", content)

    // 질문 추출 (번호나 불릿 포인트 제거)
    const questions = content
      .split(/[\r\n]+/)
      .map((line) => line.replace(/^[0-9\-*.\s]+/, "").trim())
      .filter((line) => line.length > 0 && line.endsWith("?"))

    console.log("Extracted questions:", questions)

    // 정확히 2개의 질문만 반환
    const suggestedQuestions = questions.slice(0, 2)

    // 질문이 없거나 부족한 경우 기본 질문 추가
    if (suggestedQuestions.length < 2) {
      const defaultQuestions = {
        general: ["2025년 운세는 어떤가요?", "제 사주의 장단점은?"],
        career: ["저에게 맞는 직업은?", "이직 시기는 언제인가요?"],
        love: ["올해 연애운은 어떤가요?", "좋은 인연은 언제 만날까요?"],
        health: ["주의할 건강 문제는?", "저에게 맞는 운동은?"],
        business: ["사업 시작 좋은 시기는?", "재물운을 높이려면?"],
        marriage: ["결혼 적기는 언제인가요?", "제게 맞는 배우자는?"],
        personalized: ["제 사주의 특징은?", "행운을 끌어당기려면?"],
        "daily-fortune": ["오늘의 운세는?", "오늘 주의할 점은?"],
      }

      const defaultForType = defaultQuestions[roomType as keyof typeof defaultQuestions] || defaultQuestions.general

      while (suggestedQuestions.length < 2) {
        const defaultQuestion = defaultForType[suggestedQuestions.length]
        if (!suggestedQuestions.includes(defaultQuestion)) {
          suggestedQuestions.push(defaultQuestion)
        }
      }
    }

    console.log("Final suggested questions:", suggestedQuestions)
    return NextResponse.json({ suggestedQuestions })
  } catch (error) {
    console.error("Error generating suggested questions:", error)
    return NextResponse.json(
      { error: "Failed to generate suggested questions", suggestedQuestions: [] },
      { status: 500 },
    )
  }
}
