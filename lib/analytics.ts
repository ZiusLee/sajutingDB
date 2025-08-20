import { sendGAEvent } from "@next/third-parties/google"

declare global {
  interface Window {
    amplitude?: any
    gtag?: any
  }
}

// 기본 이벤트 추적 함수
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  try {
    // Google Analytics 추적
    if (typeof window !== "undefined" && window.gtag) {
      sendGAEvent("event", eventName, parameters)
    }

    // Amplitude 추적
    trackAmplitudeEvent(eventName, parameters)
  } catch (error) {
    console.error("Analytics tracking error:", error)
  }
}

export const trackAmplitudeEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && window.amplitude) {
      window.amplitude.track(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Amplitude tracking error:", error)
  }
}

export const identifyAmplitudeUser = (userId: string, userProperties?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && window.amplitude) {
      window.amplitude.setUserId(userId)
      if (userProperties) {
        const identify = new window.amplitude.Identify()
        Object.entries(userProperties).forEach(([key, value]) => {
          identify.set(key, value)
        })
        window.amplitude.identify(identify)
      }
    }
  } catch (error) {
    console.error("Amplitude user identification error:", error)
  }
}

// 1. 통합된 이벤트 (props로 세분화)
export const trackIntegratedEvents = {
  // 페이지 뷰
  pageView: (page: "home" | "login" | "register" | "mypage" | "saju_chat" | "onboarding") => {
    trackEvent("page_view", {
      page: page,
      timestamp: new Date().toISOString(),
    })
  },

  // 로그인 클릭
  loginClick: (method: "kakao" | "email" | "google") => {
    trackEvent("login_click", {
      method: method,
      timestamp: new Date().toISOString(),
    })
  },

  // 회원가입 클릭
  registerClick: () => {
    trackEvent("register_click", {
      timestamp: new Date().toISOString(),
    })
  },

  // 버튼 클릭
  buttonClick: (buttonId: "logout" | "saju_create" | "new_chat") => {
    trackEvent("button_click", {
      button_id: buttonId,
      timestamp: new Date().toISOString(),
    })
  },

  // 폼 제출
  formSubmit: (form: "login" | "register" | "chat_message" | "password_reset") => {
    trackEvent("form_submit", {
      form: form,
      timestamp: new Date().toISOString(),
    })
  },

  // API 호출
  apiCall: (
    endpoint:
      | "saju_chat"
      | "birth_info_save"
      | "user_register"
      | "chat_room_create"
      | "memory_search"
      | "lunar_date_convert"
      | "saju_calculation"
      | "user_data_save",
  ) => {
    trackEvent("api_call", {
      endpoint: endpoint,
      timestamp: new Date().toISOString(),
    })
  },
}

// 2. AI 기능 이벤트
export const trackAIEvents = {
  messageSent: (messageLength: number, roomType?: string) => {
    trackEvent("AI_message_sent", {
      message_length: messageLength,
      room_type: roomType,
      timestamp: new Date().toISOString(),
    })
  },
}

// 3. 사용자 세션 이벤트
export const trackUserEvents = {
  sessionStart: () => {
    trackEvent("USER_session_start", {
      timestamp: new Date().toISOString(),
    })
  },

  firstVisit: () => {
    trackEvent("USER_first_visit", {
      timestamp: new Date().toISOString(),
    })
  },

  returnVisit: () => {
    trackEvent("USER_return_visit", {
      timestamp: new Date().toISOString(),
    })
  },

  profileCreated: () => {
    trackEvent("USER_profile_created", {
      timestamp: new Date().toISOString(),
    })
  },

  engagementHigh: (duration: number) => {
    trackEvent("USER_engagement_high", {
      duration: duration,
      timestamp: new Date().toISOString(),
    })
  },

  chatSessionStart: (roomType: string) => {
    trackEvent("USER_chat_session_start", {
      room_type: roomType,
      timestamp: new Date().toISOString(),
    })
  },

  memoryBankAccessed: () => {
    trackEvent("USER_memory_bank_accessed", {
      timestamp: new Date().toISOString(),
    })
  },
}

// 4. 전환 지표 이벤트
export const trackConversionEvents = {
  sajuProfileComplete: () => {
    trackEvent("CONVERSION_saju_profile_complete", {
      timestamp: new Date().toISOString(),
    })
  },

  firstChatComplete: () => {
    trackEvent("CONVERSION_first_chat_complete", {
      timestamp: new Date().toISOString(),
    })
  },

  userRetentionDay7: () => {
    trackEvent("CONVERSION_user_retention_day7", {
      timestamp: new Date().toISOString(),
    })
  },
}

// 5. 행동 패턴 이벤트
export const trackBehaviorEvents = {
  scrollDepth75: (page: string) => {
    trackEvent("BEHAVIOR_scroll_depth_75", {
      page: page,
      timestamp: new Date().toISOString(),
    })
  },

  timeOnPage5Min: (page: string) => {
    trackEvent("BEHAVIOR_time_on_page_5min", {
      page: page,
      timestamp: new Date().toISOString(),
    })
  },

  multipleQuestions: (questionCount: number) => {
    trackEvent("BEHAVIOR_multiple_questions", {
      question_count: questionCount,
      timestamp: new Date().toISOString(),
    })
  },
}

// 6. 성능 이벤트
export const trackPerformanceEvents = {
  pageLoadSlow: (page: string, loadTime: number) => {
    trackEvent("PERFORMANCE_page_load_slow", {
      page: page,
      load_time: loadTime,
      timestamp: new Date().toISOString(),
    })
  },
}

// 7. 온보딩 생명주기 이벤트
export const trackOnboardingEvents = {
  started: () => {
    trackEvent("onboarding_started", {
      timestamp: new Date().toISOString(),
    })
  },

  completed: () => {
    trackEvent("onboarding_completed", {
      timestamp: new Date().toISOString(),
    })
  },

  abandoned: (step: string) => {
    trackEvent("onboarding_abandoned", {
      step: step,
      timestamp: new Date().toISOString(),
    })
  },

  resumed: (step: string) => {
    trackEvent("onboarding_resumed", {
      step: step,
      timestamp: new Date().toISOString(),
    })
  },
}

// 8. 온보딩 세부 이벤트
export const trackOnboardingDetailEvents = {
  // 이름 입력
  inputInteraction: (field: "name", action: "focused" | "blurred" | "typed" | "cleared") => {
    trackEvent("input_interaction", {
      field: field,
      action: action,
      timestamp: new Date().toISOString(),
    })
  },

  // 성별 선택
  genderInteraction: (
    action: "clicked" | "hovered" | "changed" | "completed" | "confirmed",
    value?: "male" | "female",
  ) => {
    trackEvent("gender_interaction", {
      action: action,
      value: value,
      timestamp: new Date().toISOString(),
    })
  },

  // 도시 선택
  cityInteraction: (
    action:
      | "search_focused"
      | "search_typed"
      | "search_cleared"
      | "search_submitted"
      | "dropdown_opened"
      | "dropdown_closed"
      | "result_clicked"
      | "result_hovered"
      | "no_results"
      | "selected"
      | "confirmed"
      | "completed",
  ) => {
    trackEvent("city_interaction", {
      action: action,
      timestamp: new Date().toISOString(),
    })
  },

  // 생년월일/시간
  birthInfoInteraction: (
    field: "date" | "time" | "time_unknown",
    action: "focused" | "typed" | "validated" | "error" | "checked" | "unchecked" | "completed",
  ) => {
    trackEvent("birth_info_interaction", {
      field: field,
      action: action,
      timestamp: new Date().toISOString(),
    })
  },

  // 고민 선택
  concernInteraction: (
    action:
      | "option_clicked"
      | "option_hovered"
      | "option_selected"
      | "option_deselected"
      | "max_reached"
      | "selection_completed"
      | "step_completed",
    concernType?:
      | "crush"
      | "breakup"
      | "health"
      | "marriage"
      | "money"
      | "study"
      | "relationship_lover"
      | "career_worry"
      | "job_prepare"
      | "values"
      | "workplace_relationship"
      | "friend_relationship"
      | "family",
  ) => {
    trackEvent("concern_interaction", {
      action: action,
      concern_type: concernType,
      timestamp: new Date().toISOString(),
    })
  },

  // 페이지 로딩
  pageLoadEvent: (type: "onboarding_loaded" | "assets_loaded") => {
    trackEvent("page_load_event", {
      type: type,
      timestamp: new Date().toISOString(),
    })
  },

  // API 상태
  apiStatus: (endpoint: "saju_calculation" | "user_data_sync", status: "started" | "completed" | "failed") => {
    trackEvent("api_status", {
      endpoint: endpoint,
      status: status,
      timestamp: new Date().toISOString(),
    })
  },
}

// 페이지 조회 추적 (기존 유지)
export const trackPageView = (url: string, title?: string) => {
  trackEvent("page_view", {
    page_location: url,
    page_title: title,
  })
}

// 사주 관련 이벤트 추적 (기존 유지)
export const trackSajuEvents = {
  startCalculation: (birthYear: number, gender: string) => {
    trackEvent("saju_calculation_start", {
      event_category: "saju",
      birth_year: birthYear,
      gender: gender,
    })
  },

  viewResult: (userId?: string) => {
    trackEvent("saju_result_view", {
      event_category: "saju",
      user_id: userId,
    })
  },

  checkCompatibility: (gender1: string, gender2: string) => {
    trackEvent("compatibility_check", {
      event_category: "saju",
      gender1: gender1,
      gender2: gender2,
    })
  },

  analyzeDaeun: (birthYear: number) => {
    trackEvent("daeun_analysis", {
      event_category: "saju",
      birth_year: birthYear,
    })
  },

  checkDailyFortune: () => {
    trackEvent("daily_fortune_check", {
      event_category: "saju",
    })
  },
}

// 인증 관련 이벤트 추적 (기존 유지)
export const trackAuthEvents = {
  signIn: (method: string) => {
    trackEvent("login", {
      method: method,
    })
  },

  signUp: (method: string) => {
    trackEvent("sign_up", {
      method: method,
    })
  },

  signOut: () => {
    trackEvent("logout", {
      event_category: "auth",
    })
  },
}

// 채팅 관련 이벤트 추적 (기존 유지)
export const trackChatEvents = {
  startChat: (roomType: string) => {
    trackEvent("chat_start", {
      event_category: "chat",
      room_type: roomType,
    })
  },

  sendMessage: (messageLength: number) => {
    trackEvent("message_send", {
      event_category: "chat",
      message_length: messageLength,
    })
  },

  provideFeedback: (rating: "positive" | "negative") => {
    trackEvent("chat_feedback", {
      event_category: "chat",
      rating: rating,
    })
  },
}

// 전자상거래 이벤트 추적 (기존 유지)
export const trackEcommerceEvents = {
  beginCheckout: (coinAmount: number, price: number) => {
    trackEvent("begin_checkout", {
      event_category: "ecommerce",
      currency: "KRW",
      value: price,
      items: [
        {
          item_id: "coin",
          item_name: "사주핑 코인",
          quantity: coinAmount,
          price: price,
        },
      ],
    })
  },

  purchase: (transactionId: string, coinAmount: number, price: number) => {
    trackEvent("purchase", {
      event_category: "ecommerce",
      transaction_id: transactionId,
      currency: "KRW",
      value: price,
      items: [
        {
          item_id: "coin",
          item_name: "사주핑 코인",
          quantity: coinAmount,
          price: price,
        },
      ],
    })
  },
}

// 사용자 참여 이벤트 추적 (기존 유지)
export const trackEngagementEvents = {
  search: (searchTerm: string) => {
    trackEvent("search", {
      search_term: searchTerm,
    })
  },

  share: (contentType: string, method: string) => {
    trackEvent("share", {
      content_type: contentType,
      method: method,
    })
  },

  fileDownload: (fileName: string) => {
    trackEvent("file_download", {
      file_name: fileName,
    })
  },
}

// 성능 추적 (기존 유지)
export const trackPerformance = {
  pageLoadTime: (loadTime: number, pageName: string) => {
    trackEvent("page_load_time", {
      event_category: "performance",
      page_name: pageName,
      load_time: loadTime,
    })
  },

  apiResponseTime: (endpoint: string, responseTime: number) => {
    trackEvent("api_response_time", {
      event_category: "performance",
      endpoint: endpoint,
      response_time: responseTime,
    })
  },
}

// 오류 추적 (기존 유지)
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent("exception", {
    description: errorMessage,
    fatal: false,
    location: errorLocation,
  })
}

// 사용자 정의 이벤트 (기존 유지)
export const trackCustomEvent = (eventName: string, parameters: Record<string, any>) => {
  trackEvent(eventName, {
    event_category: "custom",
    ...parameters,
  })
}

export const quickTrack = {
  // 페이지 진입
  enterPage: (page: "home" | "login" | "register" | "mypage" | "saju_chat" | "onboarding") => {
    trackIntegratedEvents.pageView(page)
  },

  // 로그인 시도
  attemptLogin: (method: "kakao" | "email" | "google") => {
    trackIntegratedEvents.loginClick(method)
  },

  // 채팅 메시지 전송
  sendChatMessage: (messageLength: number, roomType: string) => {
    trackIntegratedEvents.formSubmit("chat_message")
    trackAIEvents.messageSent(messageLength, roomType)
  },

  // 사주 프로필 생성 완료
  completeSajuProfile: () => {
    trackConversionEvents.sajuProfileComplete()
    trackUserEvents.profileCreated()
  },

  // 온보딩 단계 완료
  completeOnboardingStep: (step: string) => {
    trackOnboardingDetailEvents.apiStatus("user_data_sync", "completed")
  },
}
