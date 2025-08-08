import { sendGAEvent } from '@next/third-parties/google'

// 기본 이벤트 추적 함수
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      sendGAEvent('event', eventName, parameters)
    }
  } catch (error) {
    console.error('Analytics tracking error:', error)
  }
}

// 페이지 조회 추적
export const trackPageView = (url: string, title?: string) => {
  trackEvent('page_view', {
    page_location: url,
    page_title: title,
  })
}

// 사주 관련 이벤트 추적
export const trackSajuEvents = {
  // 사주 계산 시작
  startCalculation: (birthYear: number, gender: string) => {
    trackEvent('saju_calculation_start', {
      event_category: 'saju',
      birth_year: birthYear,
      gender: gender,
    })
  },

  // 사주 결과 조회
  viewResult: (userId?: string) => {
    trackEvent('saju_result_view', {
      event_category: 'saju',
      user_id: userId,
    })
  },

  // 궁합 확인
  checkCompatibility: (gender1: string, gender2: string) => {
    trackEvent('compatibility_check', {
      event_category: 'saju',
      gender1: gender1,
      gender2: gender2,
    })
  },

  // 대운 분석
  analyzeDaeun: (birthYear: number) => {
    trackEvent('daeun_analysis', {
      event_category: 'saju',
      birth_year: birthYear,
    })
  },

  // 오늘의 운세
  checkDailyFortune: () => {
    trackEvent('daily_fortune_check', {
      event_category: 'saju',
    })
  },
}

// 인증 관련 이벤트 추적
export const trackAuthEvents = {
  // 로그인
  signIn: (method: string) => {
    trackEvent('login', {
      method: method,
    })
  },

  // 회원가입
  signUp: (method: string) => {
    trackEvent('sign_up', {
      method: method,
    })
  },

  // 로그아웃
  signOut: () => {
    trackEvent('logout', {
      event_category: 'auth',
    })
  },
}

// 채팅 관련 이벤트 추적
export const trackChatEvents = {
  // 채팅 시작
  startChat: (roomType: string) => {
    trackEvent('chat_start', {
      event_category: 'chat',
      room_type: roomType,
    })
  },

  // 메시지 전송
  sendMessage: (messageLength: number) => {
    trackEvent('message_send', {
      event_category: 'chat',
      message_length: messageLength,
    })
  },

  // 피드백 제공
  provideFeedback: (rating: 'positive' | 'negative') => {
    trackEvent('chat_feedback', {
      event_category: 'chat',
      rating: rating,
    })
  },
}

// 전자상거래 이벤트 추적
export const trackEcommerceEvents = {
  // 코인 구매 시작
  beginCheckout: (coinAmount: number, price: number) => {
    trackEvent('begin_checkout', {
      event_category: 'ecommerce',
      currency: 'KRW',
      value: price,
      items: [{
        item_id: 'coin',
        item_name: '사주핑 코인',
        quantity: coinAmount,
        price: price,
      }],
    })
  },

  // 구매 완료
  purchase: (transactionId: string, coinAmount: number, price: number) => {
    trackEvent('purchase', {
      event_category: 'ecommerce',
      transaction_id: transactionId,
      currency: 'KRW',
      value: price,
      items: [{
        item_id: 'coin',
        item_name: '사주핑 코인',
        quantity: coinAmount,
        price: price,
      }],
    })
  },
}

// 사용자 참여 이벤트 추적
export const trackEngagementEvents = {
  // 검색
  search: (searchTerm: string) => {
    trackEvent('search', {
      search_term: searchTerm,
    })
  },

  // 공유
  share: (contentType: string, method: string) => {
    trackEvent('share', {
      content_type: contentType,
      method: method,
    })
  },

  // 파일 다운로드
  fileDownload: (fileName: string) => {
    trackEvent('file_download', {
      file_name: fileName,
    })
  },
}

// 성능 추적
export const trackPerformance = {
  // 페이지 로드 시간
  pageLoadTime: (loadTime: number, pageName: string) => {
    trackEvent('page_load_time', {
      event_category: 'performance',
      page_name: pageName,
      load_time: loadTime,
    })
  },

  // API 응답 시간
  apiResponseTime: (endpoint: string, responseTime: number) => {
    trackEvent('api_response_time', {
      event_category: 'performance',
      endpoint: endpoint,
      response_time: responseTime,
    })
  },
}

// 오류 추적
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    location: errorLocation,
  })
}

// 사용자 정의 이벤트
export const trackCustomEvent = (eventName: string, parameters: Record<string, any>) => {
  trackEvent(eventName, {
    event_category: 'custom',
    ...parameters,
  })
}
