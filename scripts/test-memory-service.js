// Test script for Smart Memory Service V2
// Converted to JavaScript for direct execution

// Mock the smart memory service for testing
const mockSmartMemoryService = {
  async extractMemoryCandidate(userMessage, assistantResponse) {
    // Simple mock implementation for testing
    const memories = []
    let shouldSave = false
    const reasoning = "Mock extraction for testing"

    // Basic pattern matching for demo
    if (userMessage.includes("김철수")) {
      memories.push({
        type: "identity",
        content: "이름: 김철수",
        importance: 0.8,
        confidence: 0.9,
        keywords: ["김철수", "이름"],
      })
      shouldSave = true
    }

    if (userMessage.includes("서울")) {
      memories.push({
        type: "identity",
        content: "거주지: 서울",
        importance: 0.7,
        confidence: 0.8,
        keywords: ["서울", "거주지"],
      })
      shouldSave = true
    }

    if (userMessage.includes("프론트엔드") || userMessage.includes("개발자")) {
      memories.push({
        type: "identity",
        content: "직업: 프론트엔드 개발자",
        importance: 0.8,
        confidence: 0.9,
        keywords: ["프론트엔드", "개발자", "직업"],
      })
      shouldSave = true
    }

    if (userMessage.includes("이직")) {
      memories.push({
        type: "situation",
        content: "현재 상황: 이직 준비 중",
        importance: 0.7,
        confidence: 0.8,
        keywords: ["이직", "준비"],
      })
      shouldSave = true
    }

    if (userMessage.includes("여자친구") || userMessage.includes("결혼")) {
      memories.push({
        type: "relationship",
        content: "관계: 여자친구와 3년째, 결혼 예정",
        importance: 0.9,
        confidence: 0.8,
        keywords: ["여자친구", "결혼", "관계"],
      })
      shouldSave = true
    }

    return {
      shouldSave,
      memories,
      reasoning,
    }
  },

  async understandQuery(query) {
    // Mock query understanding
    const understanding = {
      intent: "search",
      keywords: [],
      memoryTypes: [],
    }

    if (query.includes("직업") || query.includes("개발자")) {
      understanding.intent = "identity_search"
      understanding.keywords = ["직업", "개발자"]
      understanding.memoryTypes = ["identity"]
    } else if (query.includes("살아") || query.includes("거주")) {
      understanding.intent = "location_search"
      understanding.keywords = ["거주지", "위치"]
      understanding.memoryTypes = ["identity"]
    } else if (query.includes("결혼") || query.includes("계획")) {
      understanding.intent = "relationship_search"
      understanding.keywords = ["결혼", "계획"]
      understanding.memoryTypes = ["relationship", "goal"]
    }

    return understanding
  },
}

const TEST_USER_ID = "test-user-123"
const TEST_CONVERSATION_ID = "test-conv-456"

// Test scenarios
const testScenarios = [
  {
    name: "기본 정보 추출",
    userMessage: "안녕하세요, 저는 서울에서 프론트엔드 개발자로 일하고 있는 김철수입니다.",
    assistantResponse: "안녕하세요 김철수님! 서울에서 프론트엔드 개발자로 일하고 계시는군요.",
    expected: ["identity: 김철수", "identity: 서울 거주", "identity: 프론트���드 개발자"],
  },
  {
    name: "중복 정보 처리",
    userMessage: "저는 소프트웨어 엔지니어예요",
    assistantResponse: "소프트웨어 엔지니어로 일하시는군요!",
    expected: ["병합: 개발자 + 소프트웨어 엔지니어"],
  },
  {
    name: "목표와 상황 구분",
    userMessage: "이직을 준비하고 있어요. 더 좋은 회사로 가고 싶어요.",
    assistantResponse: "이직 준비 중이시군요. 더 좋은 기회를 찾으시길 바랍니다.",
    expected: ["situation: 이직 준비", "goal: 더 좋은 회사 이직"],
  },
  {
    name: "관계 정보",
    userMessage: "여자친구와 3년째 사귀고 있고, 곧 결혼할 예정이에요",
    assistantResponse: "3년째 사귀시고 결혼 예정이시군요! 축하드립니다.",
    expected: ["relationship: 여자친구 3년째", "goal: 결혼 예정"],
  },
]

async function runTests() {
  console.log("🧪 Smart Memory Service V2 테스트 시작\n")

  for (const scenario of testScenarios) {
    console.log(`\n📝 테스트: ${scenario.name}`)
    console.log(`사용자: "${scenario.userMessage}"`)
    console.log(`AI: "${scenario.assistantResponse}"`)

    try {
      // 메모리 추출 테스트
      const extraction = await mockSmartMemoryService.extractMemoryCandidate(
        scenario.userMessage,
        scenario.assistantResponse,
      )

      console.log("\n추출 결과:")
      console.log(`- 저장 여부: ${extraction.shouldSave}`)
      console.log(`- 추출된 메모리: ${extraction.memories.length}개`)

      extraction.memories.forEach((memory, index) => {
        console.log(`\n  메모리 ${index + 1}:`)
        console.log(`  - 타입: ${memory.type}`)
        console.log(`  - 내용: ${memory.content}`)
        console.log(`  - 중요도: ${memory.importance}`)
        console.log(`  - 확신도: ${memory.confidence}`)
        console.log(`  - 키워드: ${memory.keywords?.join(", ") || "없음"}`)
      })

      console.log(`\n추출 이유: ${extraction.reasoning}`)

      // 예상 결과와 비교
      console.log(`\n예상 결과: ${scenario.expected.join(", ")}`)
    } catch (error) {
      console.error(`❌ 테스트 실패: ${error}`)
    }

    console.log("\n" + "=".repeat(50))
  }

  // 검색 테스트
  console.log("\n\n🔍 검색 기능 테스트")

  const searchQueries = ["직업이 뭐야?", "어디 살아?", "결혼 계획", "개발자"]

  for (const query of searchQueries) {
    console.log(`\n검색어: "${query}"`)

    try {
      // 쿼리 이해 테스트
      const understanding = await mockSmartMemoryService.understandQuery(query)
      console.log("쿼리 이해:")
      console.log(`- 의도: ${understanding.intent}`)
      console.log(`- 키워드: ${understanding.keywords.join(", ")}`)
      console.log(`- 메모리 타입: ${understanding.memoryTypes.join(", ") || "전체"}`)
    } catch (error) {
      console.error(`❌ 검색 테스트 실패: ${error}`)
    }
  }

  console.log("\n\n✅ 테스트 완료!")
}

// 테스트 실행
runTests().catch(console.error)
