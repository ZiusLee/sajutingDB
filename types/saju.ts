export interface BirthData {
  name: string
  birthDate: Date | string // 문자열도 허용하도록 수정
  birthTime?: string
  isLunar: boolean
  gender: "male" | "female"
  birthPlace: string
  interests: string[]
}

export interface SajuProfile extends BirthData {
  id: string
  relationship?: string
  createdAt: Date
}

export interface OnboardingStep {
  step: number
  title: string
  description: string
}

export interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export interface AppState {
  user: {
    id: string
    email: string
    isAuthenticated: boolean
  }
  profiles: {
    primary?: SajuProfile
    additional: SajuProfile[]
    current?: string
  }
  onboarding: {
    currentStep: number
    data: Partial<BirthData>
    isComplete: boolean
  }
}

export interface SajuElement {
  heavenly: string // 천간
  earthly: string // 지지
  element: string // 오행
  yin_yang: string // 음양
}

export interface SajuPillar {
  year: SajuElement
  month: SajuElement
  day: SajuElement
  hour?: SajuElement
}

export interface SajuResult {
  pillars: SajuPillar
  elements: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
  dayMaster: string
  interpretation: string
  strengths: string[]
  challenges: string[]
  recommendations: string[]
}

export interface CustomQuestion {
  id: string
  question: string
  category: string
  priority: number
}
