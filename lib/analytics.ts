import { sendGAEvent } from '@next/third-parties/google'

// GA ID 상수
export const GA_TRACKING_ID = 'G-YFCCKXZDEN'

// 페이지 조회 추적
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
      page_title: title,
    })
    console.log('Page view tracked:', { url, title })
  }
}

// 사용자 행동 추적
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  try {
    sendGAEvent('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
    console.log('Event tracked:', { action, category, label, value })
  } catch (error) {
    console.error('GA Event tracking failed:', error)
  }
}

// 사주 관련 이벤트들
export const trackSajuEvents = {
  // 사주 계산 시작
  startCalculation: (birthYear: number, gender: string) => {
    trackEvent('start_saju_calculation', 'saju', `${gender}_${birthYear}`)
  },

  // 사주 결과 조회
  viewResult: (resultType: string) => {
    trackEvent('view_saju_result', 'saju', resultType)
  },

  // 궁합 확인
  checkCompatibility: (userGender: string, partnerGender: string) => {
    trackEvent('check_compatibility', 'saju', `${userGender}_${partnerGender}`)
  },

  // 채팅 시작
  startChat: (chatType: string) => {
    trackEvent('start_chat', 'chat', chatType)
  },

  // 대운 분석 조회
  viewDaeunAnalysis: (age: number) => {
    trackEvent('view_daeun_analysis', 'saju', `age_${age}`)
  },

  // 일운 조회
  viewDailyFortune: (date: string) => {
    trackEvent('view_daily_fortune', 'saju', date)
  },
}

// 사용자 인증 이벤트
export const trackAuthEvents = {
  // 회원가입
  signUp: (method: string) => {
    trackEvent('sign_up', 'auth', method)
  },

  // 로그인
  signIn: (method: string) => {
    trackEvent('login', 'auth', method)
  },

  // 로그아웃
  signOut: () => {
    trackEvent('logout', 'auth')
  },
}

// 사용자 참여 이벤트
export const trackEngagementEvents = {
  // 피드백 제공
  provideFeedback: (type: 'positive' | 'negative', context: string) => {
    trackEvent('provide_feedback', 'engagement', `${type}_${context}`)
  },

  // 공유하기
  shareContent: (contentType: string, method: string) => {
    trackEvent('share_content', 'engagement', `${contentType}_${method}`)
  },

  // 검색 사용
  search: (query: string) => {
    trackEvent('search', 'engagement', query.substring(0, 50)) // 개인정보 보호를 위해 50자 제한
  },
}

// 성능 추적
export const trackTiming = (name: string, value: number, category = 'performance') => {
  try {
    sendGAEvent('timing_complete', {
      name: name,
      value: value,
      event_category: category,
    })
    console.log('Timing tracked:', { name, value, category })
  } catch (error) {
    console.error('GA Timing tracking failed:', error)
  }
}

// 오류 추적
export const trackError = (error: string, fatal = false, context?: string) => {
  try {
    sendGAEvent('exception', {
      description: `${context ? `[${context}] ` : ''}${error}`,
      fatal: fatal,
    })
    console.log('Error tracked:', { error, fatal, context })
  } catch (error) {
    console.error('GA Error tracking failed:', error)
  }
}

// 사용자 속성 설정
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      custom_map: properties
    })
    console.log('User properties set:', properties)
  }
}

// 전자상거래 이벤트 (코인 구매 등)
export const trackPurchase = (transactionId: string, value: number, currency = 'KRW', items: any[] = []) => {
  try {
    sendGAEvent('purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items
    })
    console.log('Purchase tracked:', { transactionId, value, currency, items })
  } catch (error) {
    console.error('GA Purchase tracking failed:', error)
  }
}
