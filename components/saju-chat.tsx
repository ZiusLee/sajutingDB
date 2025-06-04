"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Loader2, Send, ChevronDown, RefreshCw, Menu, Edit3, Plus, Mic } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import ReactMarkdown from "react-markdown"

// useHideHeader 훅을 확장하여 footer도 함께 숨기도록 수정
const useHideHeaderAndFooter = () => {
  useEffect(() => {
    // 상위 헤더와 푸터 요소 찾기 및 숨기기
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")

    if (header) {
      header.style.display = "none"
    }

    if (footer) {
      footer.style.display = "none"
    }

    // 컴포넌트 언마운트 시 원래대로 복원
    return () => {
      if (header) {
        header.style.display = ""
      }
      if (footer) {
        footer.style.display = ""
      }
    }
  }, [])
}

// 네트워크 상태 모니터링 훅
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

interface SajuChatProps {
  saju: any
  name: string
  gender: string
  initialInterpretation: string
  roomType: string
  onBack: () => void
  isLoggedIn?: boolean
  sessionKey: string
}

// 초기 예상 질문 목록 (채팅방 유형별)
const initialSuggestedQuestionsByType: Record<string, string[]> = {
  sajuping: [
    "직업운 알려줘",
    "연애운 알려줘",
    "건강운 알려줘",
    "재물운 알려줘",
    "올해 운세는 어떤가요?",
    "제 성격과 기질은 어떤가요?",
  ],
  general: ["2025년 운세는 어떤가요?", "제 사주의 장단점은?", "가장 강한 기운은 무엇인가요?"],
  career: ["저에게 맞는 직업은 무엇인가요?", "이직하기 좋은 시기는 언제인가요?", "승진 가능성이 높은 때는 언제인가요?"],
  career_fortune: ["제 적성에 맞는 직업 분야는?", "올해 커리어 전환에 좋은 시기는?", "직장 내 인간관계 개선 방법은?"],
  love: ["올해 연애운은 어떤가요?", "좋은 인연 만날 시기는?", "이상적인 짝은 어떤 사람인가요?"],
  love_fortune: ["제게 맞는 연애 스타일은?", "데이트 성공 확률을 높이는 방법은?", "현재 관계를 발전시키려면?"],
  health: ["주의할 건강 문제는?", "건강관리가 필요한 부분은?", "제 체질에 맞는 운동은?"],
  yearly: ["올해 주의할 시기는?", "운이 좋은 달은 언제인가요?", "중요한 결정에 좋은 시기는?"],
  business: ["사업 시작 좋은 시기는?", "투자하기 좋은 분야는?", "재물운을 높이는 방법은?"],
  marriage: ["결혼 좋은 시기는?", "제게 맞는 배우자는?", "결혼생활 주의점은?"],
  marriage_fortune: ["결혼 준비 체크리스트는?", "예비 배우자와 꼭 해야 할 대화는?", "결혼 자금 계획은 어떻게?"],
  personalized: ["고민 해결 방법은?", "인간관계 개선 방법은?", "미래 불안감 극복법은?"],
  "daily-fortune": [`오늘(${formatTodayDate()}) 운세는?`, "오늘 하루 보내는 팁은?", "오늘의 행운 요소는?"],
  fitness: ["제 체질에 맞는 운동은?", "효과적인 운동 루틴은?", "운동 시 주의할 점은?"],
  diet: ["제 체질에 맞는 식단은?", "체중 관리에 좋은 음식은?", "식이요법 추천해주세요"],
  cheerup: ["요즘 의욕이 없어요", "자신감을 높이는 방법은?", "스트레스 해소법 알려주세요"],
}

// Function to format today's date in M/d format
function formatTodayDate() {
  const today = new Date()
  return `${today.getMonth() + 1}/${today.getDate()}`
}

// 채팅방 유형별 초기 메시지
const getInitialMessageByRoomType = (name: string, roomType: string): string => {
  // 올해는 2025년 을사년으로 고정
  const currentYear = 2025
  const today = formatTodayDate()
  const userName = name || "사용자"

  switch (roomType) {
    case "sajuping":
      return `안녕하세요, ${userName}님! 저는 사주핑이에요! 🔮✨

${userName}님의 사주를 바탕으로 인생의 모든 영역에 대해 상담해드릴게요. 

💫 **상담 가능한 영역:**
• 직업운 & 적성 분석
• 연애운 & 결혼운 
• 건강운 & 체질 분석
• 재물운 & 투자 운세
• 성격 & 기질 분석
• 인생의 큰 흐름과 조언

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해에 ${userName}님이 궁금한 모든 것을 물어보세요! 

아래 추천 질문을 눌러보시거나, 직접 궁금한 점을 말씀해주세요 😊`

    case "career":
      return `안녕하세요, ${userName}님! 직업 상담사 커리어쌤입니다. 💼

${currentYear}년 을사년(乙巳年)의 직업운에 대해 상담해 드릴게요. 취업, 이직, 승진, 직장 생활 등 직업과 관련된 질문을 해주시면 사주를 바탕으로 답변해드릴게요. 어떤 직업이 잘 맞는지, 언제 이직하면 좋을지 등 구체적인 질문을 해보세요!`

    case "career_fortune":
      return `안녕하세요, ${userName}님! 커리어 코치입니다. 🚀

${userName}님의 사주를 분석해보니 특별한 직업적 재능이 보이네요. ${currentYear}년 을사년(乙巳年)에는 어떤 커리어 목표를 가지고 계신가요? 적성에 맞는 직업 분야, 승진 전략, 이직 시기 등 구체적인 질문을 해주시면 사주를 바탕으로 맞춤형 조언을 드리겠습니다.`

    case "personalized":
      return `안녕하세요, ${userName}님! 고민 상담사 마음쌤입니다. 💭

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해입니다. ${userName}님의 고민이 무엇인지 말씀해주시면, 사주를 바탕으로 해결책을 제시해드리겠습니다. 인간관계, 직장, 심리적 고민 등 어떤 것이든 편하게 말씀해주세요. 함께 해결책을 찾아보아요.`

    case "love":
      return `안녕하세요, ${userName}님! 연애 상담사 러브쌤입니다. 💕

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해인데요. 연애, 만남, 인연 등 애정 관계에 대해 궁금한 점이 있으시면 사주를 바탕으로 답변해드릴게요. 언제 좋은 인연을 만날지, 어떤 유형의 사람과 잘 맞는지 등 구체적인 질문을 해보세요. 당신의 사랑을 응원합니다!`

    case "love_fortune":
      return `안녕하세요, ${userName}님! 연애 전문 상담사입니다. ❤️

${userName}님의 사주를 보니 특별한 인연의 기운이 느껴지네요. ${currentYear}년 을사년(乙巳年)에는 어떤 사랑의 변화가 있을지 궁금하신가요? 데이트 코스 추천부터 관계 개선 방법까지, 사주를 바탕으로 실질적인 연애 조언을 드리겠습니다. 어떤 부분이 궁금하신가요?`

    case "health":
      return `안녕하세요, ${userName}님! 건강 상담사 헬스쌤입니다. 🌿

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해입니다. 체질, 건강 관리, 주의해야 할 질병 등 건강과 관련된 질문을 해주면 사주를 바탕으로 답변해드릴게요. 어떤 부분에 주의해야 하는지, 어떤 운동이나 식습관이 좋을지 등 구체적인 질문을 해보세요. 건강한 한 해를 보내시길 바랍니다!`

    case "yearly":
      return `안녕하세요, ${userName}님! 연간 운세 상담사 이어쌤입니다. 📅

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해로, 음(陰)의 목(木) 기운과 뱀의 지혜로운 에너지가 함께합니다. 올해의 전반적인 운세, 중요한 시기, 주의해야 할 점 등 올해 운세와 관련된 질문을 해주시면 사주를 바탕으로 답변해드리겠습니다. 어떤 달에 특별히 주의해야 하는지, 언제 중요한 결정을 내리면 좋을지 등 구체적인 질문을 해보세요.`

    case "daily-fortune":
      return `안녕하세요, ${userName}님! 일일 운세 봇 데일리쌤입니다. 🍀

사주를 기반으로 오늘(${today})의 운세를 알려드립니다. 오늘 하루는 어떤 운이 따를까요? 궁금한 점이 있으시면 편하게 물어보세요! 오늘 하루도 행운이 가득하길 바랍니다.`

    case "business":
      return `안녕하세요, ${userName}님! 사업 상담사 비즈쌤입니다. 💼

${currentYear}년 을사년(乙巳年)의 사업 운세와 재물운에 대해 상담해 드리겠습니다. 사업 시작 시기, 투자, 재테크 등에 관한 질문이 있으시면 사주를 바탕으로 답변해 드리겠습니다. 어떤 분야에 투자하면 좋을지, 사업 파트너는 어떤 사람이 좋을지 등 구체적인 질문을 해보세요. 성공적인 사업을 응원합니다!`

    case "marriage":
      return `안녕하세요, ${userName}님! 결혼 상담사 웨딩쌤입니다. 💍

${currentYear}년 을사년(乙巳年)의 결혼운과 가정운에 대해 상담해 드리겠습니다. 결혼 시기, 배우자 선택, 부부 관계 등에 관한 질문이 있으시면 사주를 바탕으로 답변해 드리겠습니다. 언제 결혼하면 좋을지, 어떤 사람과 결혼생활이 행복할지 등 구체적인 질문을 해보세요. 행복한 결혼을 응원합니다!`

    case "marriage_fortune":
      return `안녕하세요, ${userName}님! 결혼 전문 상담가입니다. 👰🤵

${userName}님의 사주를 보니 인연의 기운이 특별하게 흐르고 있네요. ${currentYear}년 을사년(乙巳年)에 결혼을 계획 중이신가요? 아니면 미래의 결혼에 대해 궁금하신가요? 결혼 적기부터 예비 배우자와의 관계 조화, 결혼 준비 체크리스트까지 실질적인 조언을 드리겠습니다. 무엇이 궁금하신가요?`

    case "fitness":
      return `안녕하세요, ${userName}님! 운동코치 치코쌤입니다! 💪

${userName}님의 사주와 체질에 맞는 운동 방법과 루틴을 알려드릴게요. 체중 관리, 근력 향상, 유연성 개선 등 어떤 목표가 있으신가요? 사주를 바탕으로 가장 효과적인 운동법을 제안해 드리겠습니다. 오늘부터 함께 건강한 몸을 만들어봐요! 화이팅!`

    case "diet":
      return `안녕하세요, ${userName}님! 식단코치 단식쌤입니다! 🥗

${userName}님의 사주와 체질에 맞는 맞춤 식단과 영양 조언을 해드릴게요. 건강한 식습관, 체중 관리, 에너지 증진 등 어떤 목표가 있으신가요? 사주를 바탕으로 가장 효과적인 식단을 제안해 드리겠습니다. 오늘부터 함께 건강한 식습관을 만들어봐요! 맛있게 먹으면서 건강해지는 비결을 알려드릴게요!`

    case "cheerup":
      return `안냥하세요, ${userName}님! 응원냥이 치즈예요! 😺

힘든 일이 있으신가요? 기운이 없으신가요? 치즈가 ${userName}님의 사주를 보고 딱 맞는 응원과 위로를 해드릴게요! 어떤 고민이 있든 함께 나누면 절반으로 줄어든다냥! 오늘 하루도 파이팅이에요! 무슨 일이 있었는지 치즈에게 털어놓아보세요~ 치즈가 항상 응원할게요옹!`

    case "general":
    default:
      return `안녕하세요, ${userName}님! 사주 종합 상담사 사주쌤입니다. 🔮

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해입니다. 음(陰)의 목(木) 기운과 뱀의 지혜로운 에너지가 함께하는 해로, 결혼 시기, 성공 시기, 연애 시기, 일이 풀리는 시기 등 구체적인 질문을 해주시면 사주를 바탕으로 답변해드리겠습니다. ${currentYear}년 을사년의 운세와 앞으로의 인생 흐름에 대해 궁금한 점이 있으시면 무엇이든 물어보세요! 함께 좋은 길을 찾아보아요.`
  }
}

// 사주핑 초기 메시지 생성 함수 추가
const generateSajupingInitialMessages = (name: string, saju: any): any[] => {
  const userName = name || "사용자"

  // 사주 기본 정보 추출 (안전하게)
  const yearStem = saju?.yearStem || "?"
  const yearBranch = saju?.yearBranch || "?"
  const monthStem = saju?.monthStem || "?"
  const monthBranch = saju?.monthBranch || "?"
  const dayStem = saju?.dayStem || "?"
  const dayBranch = saju?.dayBranch || "?"
  const hourStem = saju?.hourStem || ""
  const hourBranch = saju?.hourBranch || ""
  const dayMaster = saju?.dayMaster || "?"

  // 십성 정보 (안전하게)
  const yearStemSibseong = saju?.yearStemSibseong || "?"
  const yearBranchSibseong = saju?.yearBranchSibseong || "?"
  const monthStemSibseong = saju?.monthStemSibseong || "?"
  const monthBranchSibseong = saju?.monthBranchSibseong || "?"
  const dayStemSibseong = saju?.dayStemSibseong || "?"
  const dayBranchSibseong = saju?.dayBranchSibseong || "?"
  const hourStemSibseong = saju?.hourStemSibseong || "?"
  const hourBranchSibseong = saju?.hourBranchSibseong || "?"

  const yearAnimal = saju?.yearAnimal || "?"
  const elements = saju?.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  // 일간의 오행 확인 (안전하게)
  const stemElements: Record<string, string> = {
    갑: "목",
    을: "목",
    병: "화",
    정: "화",
    무: "토",
    기: "토",
    경: "금",
    신: "금",
    임: "수",
    계: "수",
  }

  const dayElement = saju?.dayStem ? stemElements[saju.dayStem] || "?" : "?"
  const dayPillar = dayStem && dayBranch ? `${dayStem}${dayBranch}` : "?"

  // 첫 번째 메시지: 사주 분석
  const firstMessage = {
    id: "saju-analysis",
    role: "assistant" as const,
    content: `안녕하세요, ${userName}님! 저는 사주핑이에요! 🔮✨

${userName}님의 사주를 분석해보니 정말 흥미로운 특징들이 보이네요!

🌟 **${userName}님의 사주 정보:**
- 년주: ${yearStem}${yearBranch} (십성: ${yearStemSibseong}, ${yearBranchSibseong})
- 월주: ${monthStem}${monthBranch} (십성: ${monthStemSibseong}, ${monthBranchSibseong})
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster}) (십성: ${dayStemSibseong}, ${dayBranchSibseong})
- 시주: ${hourStem || ""}${hourBranch || ""} ${hourStem ? `(십성: ${hourStemSibseong}, ${hourBranchSibseong})` : "(시간 미상)"}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements?.wood || 0}), 화(${elements?.fire || 0}), 토(${elements?.earth || 0}), 금(${elements?.metal || 0}), 수(${elements?.water || 0})

🌟 **${userName}님의 사주 해석:**

1. **인생의 큰 흐름과 중심 에너지** 💫
${userName}님은 ${dayElement}의 기운을 가진 ${dayPillar}일주로, ${getLifeThemeDescription(dayStem, dayBranch, dayElement)}

2. **성격과 기질** 🌱
${getPersonalityDescription(dayStem, dayBranch, elements)}

${userName}님만의 독특한 에너지와 잠재력이 느껴져요! 더 자세한 사항이 궁금하시면 편하게 물어보세요! ✨`,
  }

  // 두 번째 메시지: 간단한 질문
  const secondMessage = {
    id: "consultation-start",
    role: "assistant" as const,
    content: `오늘은 어떤 것이 궁금하세요? 😊`,
  }

  return [firstMessage, secondMessage]
}

// 일간 오행별 설명 함수
const getDayElementDescription = (element: string): string => {
  switch (element) {
    case "목":
      return "성장과 발전을 추구하며, 창의적이고 유연한 사고를 가지고 계세요"
    case "화":
      return "열정적이고 활동적이며, 사람들과의 소통을 즐기는 성향이에요"
    case "토":
      return "안정적이고 신뢰할 수 있으며, 포용력이 뛰어난 분이에요"
    case "금":
      return "결단력이 있고 정확하며, 원칙을 중시하는 성향을 가지고 계세요"
    case "수":
      return "지혜롭고 적응력이 뛰어나며, 깊이 있는 사고를 하는 분이에요"
    default:
      return "독특하고 특별한 기운을 가지고 계세요"
  }
}

// 인생의 큰 흐름과 중심 에너지 설명 함수
const getLifeThemeDescription = (dayStem: string, dayBranch: string, dayElement: string): string => {
  // 일간과 일지의 조합에 따른 인생 테마 설명
  const stemBranchCombo = `${dayStem}${dayBranch}`

  switch (dayElement) {
    case "목":
      return "어린 시절부터 성장과 발전을 추구하는 성향이 강했을 것입니다. 청년기에는 새로운 아이디어와 도전을 통해 자신의 길을 개척하고, 중년기에는 자신만의 영역에서 안정적인 성장을 이루게 됩니다. 장년기와 노년기에는 자신의 경험과 지혜를 다른 사람들과 나누며 더 큰 성취감을 느끼게 될 것입니다. 삶의 중심에는 항상 '성장'과 '발전'이라는 키워드가 자리 잡고 있으며, 이를 통해 자신과 주변 사람들에게 긍정적인 영향을 미치게 됩니다."
    case "화":
      return "타고난 열정과 에너지로 어린 시절부터 주변 사람들의 관심을 받았을 것입니다. 청년기에는 자신의 열정을 표현하고 다양한 경험을 통해 자신을 발견하는 시간을 가지게 됩니다. 중년기에는 자신의 열정을 특정 분야에 집중하여 빛나는 성과를 이루며, 장년기와 노년기에는 자신의 경험을 바탕으로 다른 사람들에게 영감을 주는 역할을 하게 됩니다. 삶의 중심에는 '열정'과 '표현'이라는 키워드가 있으며, 이를 통해 자신과 주변 사람들에게 활력과 기쁨을 전달하게 됩니다."
    case "토":
      return "어린 시절부터 안정과 조화를 중요시하는 성향이 강했을 것입니다. 청년기에는 기초를 탄탄히 다지는 데 집중하고, 중년기에는 자신의 영역에서 안정적인 위치를 확보하게 됩니다. 장년기와 노년기에는 자신이 쌓아온 기반을 바탕으로 다른 사람들을 지원하고 보살피는 역할을 하게 될 것입니다. 삶의 중심에는 '안정'과 '조화'라는 키워드가 있으며, 이를 통해 자신과 주변 사람들에게 신뢰와 안정감을 제공하게 됩니다."
    case "금":
      return "어린 시절부터 정확하고 원칙적인 성향이 강했을 것입니다. 청년기에는 자신의 가치관과 원칙을 확립하고, 중년기에는 이를 바탕으로 자신만의 영역에서 권위와 존경을 얻게 됩니다. 장년기와 노년기에는 자신의 경험과 지혜를 바탕으로 다른 사람들에게 조언과 지도를 제공하는 역할을 하게 될 것입니다. 삶의 중심에는 '정확성'과 '원칙'이라는 키워드가 있으며, 이를 통해 자신과 주변 사람들에게 명확한 방향성을 제시하게 됩니다."
    case "수":
      return "어린 시절부터 깊은 사고와 통찰력을 가진 성향이 강했을 것입니다. 청년기에는 다양한 지식과 경험을 통해 자신만의 지혜를 쌓고, 중년기에는 이를 바탕으로 깊이 있는 통찰력을 발휘하게 됩니다. 장년기와 노년기에는 자신의 지혜와 경험을 바탕으로 다른 사람들에게 영감과 통찰력을 제공하는 역할을 하게 될 것입니다. 삶의 중심에는 '지혜'와 '적응력'이라는 키워드가 있으며, 이를 통해 자신과 주변 사람들에게 깊이 있는 이해와 통찰력을 제공하게 됩니다."
    default:
      return "독특한 에너지와 잠재력을 가지고 있으며, 삶의 여정에서 자신만의 특별한 길을 걷게 될 것입니다. 어린 시절부터 노년기까지 자신만의 방식으로 성장하고 발전하며, 주변 사람들에게 긍정적인 영향을 미치게 될 것입니다."
  }
}

// 성격과 기질 설명 함수
const getPersonalityDescription = (dayStem: string, dayBranch: string, elements: any): string => {
  // 일간과 오행 분포에 따른 성격 설명
  const dominantElement = getDominantElement(elements)

  switch (dayStem) {
    case "갑":
    case "을":
      return (
        "목(木)의 기운이 강한 당신은 성장과 발전을 추구하는 성향이 있습니다. 새로운 아이디어와 가능성을 발견하는 데 탁월하며, 창의적인 사고방식으로 문제를 해결합니다. 스트레스를 받으면 더 많은 정보와 지식을 찾아 해결책을 모색하는 경향이 있으며, 대인관계에서는 유연하고 적응력이 뛰어납니다. " +
        getDominantElementInfluence(dominantElement)
      )
    case "병":
    case "정":
      return (
        "화(火)의 기운이 강한 당신은 열정적이고 활동적인 성향이 있습니다. 자신의 생각과 감정을 표현하는 데 능숙하며, 다른 사람들에게 영감을 주는 능력이 있습니다. 스트레스를 받으면 감정을 표출하고 활동적으로 해소하려는 경향이 있으며, 대인관계에서는 따뜻하고 친근한 모습을 보입니다. " +
        getDominantElementInfluence(dominantElement)
      )
    case "무":
    case "기":
      return (
        "토(土)의 기운이 강한 당신은 안정적이고 신뢰할 수 있는 성향이 있습니다. 실용적이고 현실적인 접근 방식으로 문제를 해결하며, 다른 사람들을 돌보고 지원하는 데 능숙합니다. 스트레스를 받으면 안정감을 찾기 위해 익숙한 환경과 루틴을 찾는 경향이 있으며, 대인관계에서는 신뢰와 안정감을 중요시합니다. " +
        getDominantElementInfluence(dominantElement)
      )
    case "경":
    case "신":
      return (
        "금(金)의 기운이 강한 당신은 정확하고 원칙적인 성향이 있습니다. 분석적이고 논리적인 사고방식으로 문제를 해결하며, 효율성과 정확성을 중요시합니다. 스트레스를 받으면 더 많은 구조와 질서를 찾으려는 경향이 있으며, 대인관계에서는 명확한 경계와 원칙을 중요시합니다. " +
        getDominantElementInfluence(dominantElement)
      )
    case "임":
    case "계":
      return (
        "수(水)의 기운이 강한 당신은 지혜롭고 적응력이 뛰어난 성향이 있습니다. 깊이 있는 사고와 통찰력으로 문제를 해결하며, 변화하는 상황에 유연하게 대응합니다. 스트레스를 받으면 내면의 지혜와 직관을 통해 해결책을 찾으려는 경향이 있으며, 대인관계에서는 깊이 있는 이해와 공감을 중요시합니다. " +
        getDominantElementInfluence(dominantElement)
      )
    default:
      return "독특한 성향과 기질을 가지고 있으며, 자신만의 방식으로 세상을 바라보고 해석합니다. 스트레스 상황에서는 자신만의 독특한 방식으로 대처하며, 대인관계에서도 자신만의 특별한 매력으로 사람들과 소통합니다."
  }
}

// 가장 강한 오행 요소 찾기
const getDominantElement = (elements: any): string => {
  if (!elements) return "none"

  const elementCounts = [
    { type: "wood", count: elements.wood || 0 },
    { type: "fire", count: elements.fire || 0 },
    { type: "earth", count: elements.earth || 0 },
    { type: "metal", count: elements.metal || 0 },
    { type: "water", count: elements.water || 0 },
  ]

  elementCounts.sort((a, b) => b.count - a.count)
  return elementCounts[0].type
}

// 가장 강한 오행의 영향 설명
const getDominantElementInfluence = (element: string): string => {
  switch (element) {
    case "wood":
      return "특히 목(木)의 기운이 강하게 나타나, 창의성과 성장 지향적인 성향이 더욱 두드러집니다."
    case "fire":
      return "특히 화(火)의 기운이 강하게 나타나, 열정적이고 표현력이 풍부한 성향이 더욱 두드러집니다."
    case "earth":
      return "특히 토(土)의 기운이 강하게 나타나, 안정적이고 신뢰할 수 있는 성향이 더욱 두드러집니다."
    case "metal":
      return "특히 금(金)의 기운이 강하게 나타나, 정확하고 원칙적인 성향이 더욱 두드러집니다."
    case "water":
      return "특히 수(水)의 기운이 강하게 나타나, 지혜롭고 적응력이 뛰어난 성향이 더욱 두드러집니다."
    default:
      return "오행의 균형이 잘 잡혀 있어, 다양한 상황에 유연하게 대응할 수 있는 능력이 있습니다."
  }
}

// 채팅방 유형별 제목
function getRoomTitle(roomType: string): string {
  switch (roomType) {
    case "sajuping":
      return "사주핑"
    case "general":
      return "종합 운세 상담"
    case "career":
      return "직업/진로 상담"
    case "career_fortune":
      return "커리어 코칭"
    case "love":
      return "애정운 상담"
    case "love_fortune":
      return "연애 코칭"
    case "health":
      return "건강 상담"
    case "yearly":
      return "올해운 상담"
    case "business":
      return "사업운 상담"
    case "marriage":
      return "결혼운 상담"
    case "marriage_fortune":
      return "결혼 준비 상담"
    case "personalized":
      return "맞춤 고민 상담"
    case "daily-fortune":
      return "오늘의 운세"
    case "fitness":
      return "운동코치 치코쌤"
    case "diet":
      return "식단코치 단식쌤"
    case "cheerup":
      return "응원냥이 치즈"
    default:
      return "사주 상담"
  }
}

// 채팅방 유형별 상담사 이름
const getConsultantName = (roomType: string): string => {
  switch (roomType) {
    case "sajuping":
      return "사주핑"
    case "career":
      return "커리어쌤"
    case "career_fortune":
      return "커리어 코치"
    case "love":
      return "러브쌤"
    case "love_fortune":
      return "연애 코치"
    case "health":
      return "헬스쌤"
    case "yearly":
      return "이어쌤"
    case "business":
      return "비즈쌤"
    case "marriage":
      return "웨딩쌤"
    case "marriage_fortune":
      return "결혼 코치"
    case "personalized":
      return "마음쌤"
    case "daily-fortune":
      return "데일리쌤"
    case "fitness":
      return "치코쌤"
    case "diet":
      return "단식쌤"
    case "cheerup":
      return "치즈"
    case "general":
    default:
      return "사주쌤"
  }
}

// Function to generate a unique chat session key
const generateChatSessionKey = (name: string, saju: any, roomType: string) => {
  // 사주 데이터에서 고유 식별자로 사용할 핵심 정보만 추출
  const birthYear = saju.year || ""
  const birthMonth = saju.month || ""
  const birthDay = saju.day || ""
  const birthHour = saju.hour || ""
  const gender = saju.gender || ""

  // 채팅방 유형을 명확하게 포함하여 세션 키 생성
  return `chat_${name}_${birthYear}${birthMonth}${birthDay}${birthHour}_${gender}_${roomType}`
}

// Add a function to get model badge text based on room type
const getModelBadgeText = (roomType: string): string | null => {
  switch (roomType) {
    case "sajuping":
      return "사주핑 AI"
    case "career":
      return "전문 직업 상담 모델"
    case "marriage":
      return "전문 결혼 상담 모델"
    case "health":
      return "전문 건강 상담 모델"
    default:
      return null
  }
}

// Update the getInitialMessage function to include initial messages for the new room types
function getInitialMessage(roomType: string): string {
  switch (roomType) {
    case "sajuping":
      return "안녕하세요! 저는 사주핑이에요! 사주와 관련된 모든 질문을 해주세요!"
    case "general":
      return "안녕하세요! 사주와 관련된 질문이 있으신가요?"
    case "career":
      return "안녕하세요! 직업이나 진로에 관한 상담을 도와드릴게요."
    case "marriage":
      return "안녕하세요! 결혼이나 연애에 관한 상담을 도와드릴게요."
    case "health":
      return "안녕하세요! 건강에 관한 상담을 도와드릴게요."
    case "business":
      return "안녕하세요! 사업이나 재테크에 관한 상담을 도와드릴게요."
    case "fitness":
      return "안녕하세요! 운동코치 치코쌤입니다. 운동과 피트니스에 관한 상담을 도와드릴게요. 어떤 운동 목표가 있으신가요?"
    case "diet":
      return "안녕하세요! 식단코치 단식쌤입니다. 건강한 식단과 영양에 관한 상담을 도와드릴게요. 어떤 식단 목표가 있으신가요?"
    case "cheerup":
      return "안냥하세요! 응원냥이 치즈예요! 오늘 힘든 일이 있었나요? 무슨 일이든 털어놓으세요, 제가 응원해드릴게요!"
    default:
      return "안녕하세요! 무엇을 도와드릴까요?"
  }
}

export default function SajuChat({
  saju,
  name,
  gender,
  initialInterpretation,
  roomType,
  onBack,
  isLoggedIn = false,
  sessionKey,
}: SajuChatProps) {
  // 상단 헤더 숨기기
  useHideHeaderAndFooter()

  // 네트워크 상태 모니터링
  const isOnline = useNetworkStatus()

  // 로그인 관련 상태
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Chat context
  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  // 로그인 페이지로 이동
  const handleLogin = () => {
    router.push("/login?returnUrl=" + encodeURIComponent(window.location.pathname))
  }

  // 로그인 프롬프트 닫기
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false)
  }

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }

    fetchUser()
  }, [supabase])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general,
  )
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date())
  const [lastMessageId, setLastMessageId] = useState<string>("")
  const [shouldGenerateQuestions, setShouldGenerateQuestions] = useState(true)
  // showSajuInfo 초기값을 사주핑인 경우 true로 설정
  const [showSajuInfo, setShowSajuInfo] = useState(roomType === "sajuping")
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true)
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0) // 재시도 횟수 추적

  // 응답 품질 확인 함수 - 컴포넌트 내부로 이동
  const checkResponseQuality = useCallback((content: string) => {
    // 응답이 너무 짧은 경우 (100자 미만)
    if (content.length < 100) {
      return {
        isGoodQuality: false,
        reason: "응답이 너무 짧습니다.",
      }
    }

    // 응답이 중간에 끊긴 것 같은 경우
    if (
      content.endsWith("...") ||
      content.endsWith("…") ||
      content.endsWith(",") ||
      content.endsWith("하지만") ||
      content.endsWith("그러나") ||
      content.endsWith("따라서")
    ) {
      return {
        isGoodQuality: false,
        reason: "응답이 완전하지 않습니다.",
      }
    }

    return { isGoodQuality: true }
  }, [])

  // Get saved chat session or create initial messages
  const savedSession = activeChatSession || getChatSession(sessionKey)

  // 초기 메시지 생성 로직 수정
  let initialMessages: any[] = []
  if (savedSession?.messages) {
    initialMessages = savedSession.messages
  } else if (roomType === "sajuping") {
    try {
      initialMessages = generateSajupingInitialMessages(name, saju)
    } catch (error) {
      console.error("Error generating sajuping initial messages:", error)
      // 폴백으로 기본 메시지 사용
      initialMessages = [
        {
          id: "welcome",
          role: "assistant" as const,
          content: getInitialMessageByRoomType(name, roomType),
        },
      ]
    }
  } else {
    initialMessages = [
      {
        id: "welcome",
        role: "assistant" as const,
        content: getInitialMessageByRoomType(name, roomType),
      },
    ]
  }

  // AI SDK의 useChat 훅 사용
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, error, reload, append } = useAIChat({
    api: "/api/saju-chat",
    initialMessages,
    body: {
      saju,
      name,
      gender,
      initialInterpretation,
      roomType,
      userId, // 사용자 ID 전달
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
    },
    onFinish: (message) => {
      // 응답 품질 확인
      const qualityCheck = checkResponseQuality(message.content)

      if (!qualityCheck.isGoodQuality && retryCount < 2) {
        console.log(`응답 품질 문제 감지: ${qualityCheck.reason}. 자동 재시도 중...`)
        setRetryCount((prev) => prev + 1)

        // 짧은 지연 후 재시도
        setTimeout(() => {
          reload()
        }, 1000)

        return
      }

      // 기존 코드 유지...
      const newTime = new Date()
      setLastMessageTime(newTime)
      setLastMessageId(message.id)

      // 채팅 데이터 저장 - 완료된 메시지를 포함하여 저장
      const updatedMessages = [...messages, message]

      // 현재 채팅방 유형에 맞는 세션 키 생성
      const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)

      // Save to context with the correct session key
      const sessionData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        roomType,
        messages: updatedMessages,
        lastMessageTime: newTime.toISOString(),
      }

      try {
        saveChatSession(currentSessionKey, sessionData)
        setActiveChatSession(sessionData)
      } catch (saveError) {
        console.error("Error saving chat session:", saveError)
      }

      // 메시지가 완료되면 질문 생성 허용
      setShouldGenerateQuestions(true)

      // 오류 상태 초기화
      setStreamingError(null)

      // 재시도 횟수 초기화
      setRetryCount(0)
    },
    onError: (error) => {
      console.error("Chat error:", error)

      // 오류 상태 설정
      let errorMessage = "응답 생성 중 오류가 발생했습니다."

      if (error.message) {
        errorMessage = error.message

        // 네트워크 오류인 경우 특별 처리
        if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요."
        } else if (error.message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요."
        } else if (error.message.includes("model")) {
          errorMessage = "AI 모델 로딩 중 오류가 발생했습니다. 다시 시도해주세요."
        } else if (error.message.includes("parse") || error.message.includes("JSON")) {
          errorMessage = "응답 처리 중 오류가 발생했습니다. 다시 시도해주세요."
        }
      }

      setStreamingError(errorMessage)

      // 오류 발생 시에도 질문 생성 허용
      setShouldGenerateQuestions(true)
    },
    onResponse: (response) => {
      // 응답이 시작되면 스크롤을 아래로 이동
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
          })
        }, 100)
      }

      // 오류 상태 초기화
      setStreamingError(null)
    },
    options: {
      timeout: 60000, // 타임아웃을 60초로 설정 (기본값보다 길게)
    },
  })

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    // 재시도 횟수 제한 (최대 3회)
    if (retryCount >= 3) {
      setStreamingError("여러 번 재시도했으나 계속 오류가 발생합니다. 잠시 후 다시 시도해주세요.")
      return
    }

    setIsRetrying(true)
    setStreamingError(null)
    setRetryCount((prev) => prev + 1)

    try {
      // 마지막 사용자 메시지 찾기
      const lastUserMessageIndex = [...messages].reverse().findIndex((msg) => msg.role === "user")

      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = [...messages].reverse()[lastUserMessageIndex]

        // 동일한 질문으로 다시 시도
        append({
          role: "user",
          content: lastUserMessage.content,
        })
      } else {
        // 사용자 메시지가 없는 경우 그냥 재시도
        reload()
      }
    } catch (error) {
      console.error("Error in retry handler:", error)
      setStreamingError("재시도 중 오류가 발생했습니다. 페이지를 새로고침해주세요.")
    } finally {
      setIsRetrying(false)
    }
  }, [messages, append, reload, retryCount])

  // 원래의 handleSubmit 함수 저장
  const originalHandleSubmit = handleSubmit

  // handleSubmit 함수 오버라이드
  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 네트워크 연결 확인
    if (!isOnline) {
      setStreamingError("인터넷 연결이 없습니다. 연결 상태를 확인한 후 다시 시도해주세요.")
      return
    }

    // 질문 카운트 증가
    const newQuestionCount = questionCount + 1
    setQuestionCount(newQuestionCount)

    // 모바일에서 키보드 닫기
    if (inputRef.current) {
      inputRef.current.blur()
    }

    // Show login prompt after 5 questions if not already shown
    const shouldShowLoginPrompt = newQuestionCount >= 5 && !isLoggedIn && !hasShownLoginPrompt

    if (shouldShowLoginPrompt) {
      setLoginPromptMessage("5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.")
      setShowLoginPrompt(true)
      setHasShownLoginPrompt(true)
    }

    // 사용자가 질문을 제출하면 질문 생성 플래그를 false로 설정
    setShouldGenerateQuestions(false)

    // 오류 상태 초기화
    setStreamingError(null)

    // 재시도 횟수 초기화
    setRetryCount(0)

    // 원래의 handleSubmit 함수 호출
    originalHandleSubmit(e)
  }

  // 뒤로가기 핸들러 - 채팅 데이터 저장 후 /result 페이지로 이동
  const handleBackWithSave = () => {
    try {
      // 채팅 데이터 저장 (오류가 발생해도 계속 진행)
      try {
        const sessionData = {
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          roomType,
          messages,
          lastMessageTime: new Date().toISOString(),
        }
        saveChatSession(sessionKey, sessionData)
      } catch (saveError) {
        console.error("채팅 세션 저장 중 오류:", saveError)
      }

      // 채팅 리스트에서 사용할 사주 정보를 localStorage에 저장
      try {
        localStorage.setItem(
          "last_chat_saju_data",
          JSON.stringify({
            saju,
            name,
            gender,
            interpretation: initialInterpretation,
          }),
        )
      } catch (storageError) {
        console.error("사주 데이터 저장 중 오류:", storageError)
      }

      // 뒤로가기 실행
      onBack()
    } catch (error) {
      console.error("뒤로가기 처리 중 오류:", error)
      // 오류가 발생해도 뒤로가기는 실행
      onBack()
    }
  }

  // 추천 질문 클릭 핸들러
  const handleSuggestedQuestionClick = (question: string) => {
    // 이미 로딩 중이면 중복 제출 방지
    if (isLoading) return

    setInput(question)
    // 자동으로 전송
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  // 추천 질문 생성 함수
  const generateSuggestedQuestions = useCallback(async () => {
    // 이미 생성 중이거나 조건이 맞지 않으면 중단
    if (!shouldGenerateQuestions || isGeneratingQuestions || messages.length < 2) {
      return
    }

    // 마지막 메시지가 AI 응답이 아니면 생성하지 않음
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") {
      return
    }

    // 중복 호출 방지를 위해 플래그 설정
    setIsGeneratingQuestions(true)
    setShouldGenerateQuestions(false)

    try {
      // 기본 추천 질문 (API 호출 실패 시 폴백용)
      const defaultQuestions = initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general

      const response = await fetch("/api/suggested-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.slice(-4), // 최근 4개 메시지만 전송
          roomType,
          saju,
          name,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setSuggestedQuestions(data.questions)
        } else {
          // API가 빈 배열을 반환하면 기본 질문 사용
          setSuggestedQuestions(defaultQuestions)
        }
      } else {
        // API 호출 실패 시 기본 질문 사용
        setSuggestedQuestions(defaultQuestions)
      }
    } catch (error) {
      console.error("추천 질문 생성 오류:", error)
      // 오류 발생 시 기본 질문 사용
      setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }, [messages, roomType, saju, name, initialSuggestedQuestionsByType])

  // 메시지가 변경될 때마다 추천 질문 생성
  useEffect(() => {
    // 메시지가 변경되고 마지막 메시지가 AI의 응답일 때만 새 질문 생성
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isGeneratingQuestions) {
      // 이전 타이머 취소를 위한 변수
      const timer = setTimeout(() => {
        setShouldGenerateQuestions(true)
        generateSuggestedQuestions()
      }, 2000) // 2초 후에 생성

      return () => clearTimeout(timer)
    }
  }, [messages, isGeneratingQuestions, generateSuggestedQuestions])

  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // 메시지가 변경될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 컴포넌트 마운트 시 스크롤을 아래로 이동
  useEffect(() => {
    if (!isInitialized) {
      setTimeout(() => {
        scrollToBottom()
        setIsInitialized(true)
      }, 100)
    }
  }, [isInitialized])

  // 네트워크 상태 변경 시 알림
  useEffect(() => {
    if (!isOnline) {
      setStreamingError("인터넷 연결이 끊어졌습니다. 연결 상태를 확인해주세요.")
    } else if (streamingError?.includes("인터넷 연결")) {
      setStreamingError(null)
    }
  }, [isOnline, streamingError])

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* ChatGPT 스타일 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBackWithSave} className="p-1">
            <Menu className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-medium text-gray-900">{getRoomTitle(roomType)}</h1>
          {roomType === "sajuping" && <span className="text-sm text-gray-500">AI</span>}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSajuInfo(!showSajuInfo)} className="p-1">
            <Edit3 className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* 사주 정보 카드 (접을 수 있음) */}
      {showSajuInfo && (
        <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="max-w-3xl mx-auto">
            <SajuDiagram saju={saju} name={name} />
          </div>
        </div>
      )}

      {/* 채팅 영역 */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div key={message.id || index} className="space-y-4">
              {message.role === "user" ? (
                // 사용자 메시지
                <div className="flex justify-end">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-[80%]">
                    <p className="text-gray-900 text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ) : (
                // AI 메시지
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🤖</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="text-gray-900 leading-relaxed mb-3 last:mb-0">{children}</p>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-900">{children}</li>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>,
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-2 text-gray-900">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold mb-2 text-gray-900">{children}</h3>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">🤖</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 스트리밍 오류 표시 */}
          {streamingError && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">⚠️</span>
              </div>
              <div className="flex-1">
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
                  <p className="text-sm mb-2">{streamingError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        재시도 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        다시 시도
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 추천 질문 영역 */}
      {showSuggestedQuestions && suggestedQuestions.length > 0 && !isLoading && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestionClick(question)}
                  className="text-sm bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-4 py-2"
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ChatGPT 스타일 입력 영역 */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={customHandleSubmit} className="relative">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-3">
              <Button type="button" variant="ghost" size="sm" className="p-1 mr-2" disabled={isLoading}>
                <Plus className="h-5 w-5 text-gray-500" />
              </Button>

              <input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder={
                  !isOnline ? "인터넷 연결을 확인해주세요" : isLoading ? "답변을 기다리는 중..." : "Ask anything"
                }
                className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-500"
                disabled={isLoading || !isOnline}
              />

              <div className="flex items-center space-x-2 ml-2">
                <Button type="button" variant="ghost" size="sm" className="p-1" disabled={isLoading}>
                  <Mic className="h-5 w-5 text-gray-500" />
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || !input.trim() || !isOnline}
                  className="bg-black hover:bg-gray-800 text-white rounded-full p-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>

          {/* 질문 카운트 표시 (비로그인 사용자만) */}
          {!isLoggedIn && (
            <div className="mt-2 text-center">
              <span className="text-xs text-gray-500">
                질문 {questionCount}/5 {questionCount >= 5 && "(로그인하면 무제한 질문 가능)"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 로그인 프롬프트 다이얼로그 */}
      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={handleCloseLoginPrompt}
        onLogin={handleLogin}
        message={loginPromptMessage}
      />
    </div>
  )
}
