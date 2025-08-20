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

const getCommonParameters = () => {
  if (typeof window === "undefined") return {}

  return {
    timestamp: new Date().toISOString(),
    session_id: sessionStorage.getItem("session_id") || "unknown",
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || "direct",
    page_url: window.location.href,
    page_path: window.location.pathname,
  }
}

const getUserContext = () => {
  if (typeof window === "undefined") return {}

  const visitCount = Number.parseInt(localStorage.getItem("visit_count") || "0")
  const firstVisit = localStorage.getItem("first_visit_date")
  const lastVisit = localStorage.getItem("last_visit_date")

  return {
    visit_count: visitCount,
    is_returning_user: visitCount > 1,
    first_visit_date: firstVisit,
    last_visit_date: lastVisit,
    days_since_first_visit: firstVisit
      ? Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
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

export const trackAIEvents = {
  messageSent: (messageLength: number, roomType?: string, messageType?: "question" | "followup" | "clarification") => {
    trackEvent("AI_message_sent", {
      message_length: messageLength,
      message_character_count: messageLength,
      room_type: roomType,
      message_type: messageType,
      conversation_turn: Number.parseInt(sessionStorage.getItem("conversation_turn") || "1"),
      session_duration: Date.now() - Number.parseInt(sessionStorage.getItem("session_start") || "0"),
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  responseReceived: (responseLength: number, responseTime: number, roomType?: string) => {
    trackEvent("AI_response_received", {
      response_length: responseLength,
      response_time_ms: responseTime,
      room_type: roomType,
      conversation_turn: Number.parseInt(sessionStorage.getItem("conversation_turn") || "1"),
      ...getCommonParameters(),
    })
  },

  conversationCompleted: (totalMessages: number, totalDuration: number, roomType?: string) => {
    trackEvent("AI_conversation_completed", {
      total_messages: totalMessages,
      total_duration_ms: totalDuration,
      room_type: roomType,
      avg_message_length: 0, // 계산 필요
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },
}

export const trackUserEvents = {
  sessionStart: (entryPoint?: string, utmSource?: string) => {
    // 세션 ID 생성 및 저장
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("session_id", sessionId)
    sessionStorage.setItem("session_start", Date.now().toString())

    // 방문 횟수 업데이트
    const visitCount = Number.parseInt(localStorage.getItem("visit_count") || "0") + 1
    localStorage.setItem("visit_count", visitCount.toString())
    localStorage.setItem("last_visit_date", new Date().toISOString())

    if (visitCount === 1) {
      localStorage.setItem("first_visit_date", new Date().toISOString())
    }

    trackEvent("USER_session_start", {
      session_id: sessionId,
      entry_point: entryPoint || "direct",
      utm_source: utmSource,
      is_first_session: visitCount === 1,
      visit_number: visitCount,
      device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  firstVisit: (acquisitionChannel?: string) => {
    trackEvent("USER_first_visit", {
      acquisition_channel: acquisitionChannel || "organic",
      landing_page: window.location.pathname,
      ...getCommonParameters(),
    })
  },

  returnVisit: (daysSinceLastVisit?: number) => {
    trackEvent("USER_return_visit", {
      days_since_last_visit: daysSinceLastVisit || 0,
      return_frequency: daysSinceLastVisit && daysSinceLastVisit < 7 ? "frequent" : "occasional",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  profileCreated: (profileCompleteness?: number, creationMethod?: "onboarding" | "manual") => {
    trackEvent("USER_profile_created", {
      profile_completeness: profileCompleteness || 0,
      creation_method: creationMethod || "onboarding",
      time_to_create: Date.now() - Number.parseInt(sessionStorage.getItem("session_start") || "0"),
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  engagementHigh: (duration: number, interactionCount?: number, pageDepth?: number) => {
    trackEvent("USER_engagement_high", {
      session_duration: duration,
      interaction_count: interactionCount || 0,
      page_depth: pageDepth || 1,
      engagement_score: Math.min(100, (duration / 1000 / 60) * 10 + (interactionCount || 0) * 5), // 간단한 점수 계산
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  chatSessionStart: (roomType: string, isFirstChat?: boolean) => {
    trackEvent("USER_chat_session_start", {
      room_type: roomType,
      is_first_chat: isFirstChat || false,
      chat_session_id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_onboarding_completed: localStorage.getItem("onboarding_completed") === "true",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  memoryBankAccessed: (accessType?: "search" | "browse" | "direct", searchQuery?: string) => {
    trackEvent("USER_memory_bank_accessed", {
      access_type: accessType || "direct",
      search_query: searchQuery,
      memory_bank_size: 0, // 실제 메모리 뱅크 크기로 대체 필요
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },
}

export const trackConversionEvents = {
  sajuProfileComplete: (completionTime?: number, profileAccuracy?: number) => {
    trackEvent("CONVERSION_saju_profile_complete", {
      completion_time_ms: completionTime || 0,
      profile_accuracy: profileAccuracy || 0,
      conversion_step: "profile_creation",
      funnel_stage: "activation",
      time_to_conversion: Date.now() - Number.parseInt(sessionStorage.getItem("session_start") || "0"),
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  firstChatComplete: (chatDuration?: number, messageCount?: number, satisfactionScore?: number) => {
    trackEvent("CONVERSION_first_chat_complete", {
      chat_duration_ms: chatDuration || 0,
      message_count: messageCount || 0,
      satisfaction_score: satisfactionScore || 0,
      conversion_step: "first_interaction",
      funnel_stage: "engagement",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  userRetentionDay7: (totalSessions?: number, totalChatTime?: number, featureUsage?: string[]) => {
    trackEvent("CONVERSION_user_retention_day7", {
      total_sessions: totalSessions || 0,
      total_chat_time_ms: totalChatTime || 0,
      features_used: featureUsage || [],
      retention_quality: totalSessions && totalSessions > 3 ? "high" : "low",
      conversion_step: "retention",
      funnel_stage: "loyalty",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },
}

export const trackBehaviorEvents = {
  scrollDepth75: (page: string, timeToScroll?: number, contentHeight?: number) => {
    trackEvent("BEHAVIOR_scroll_depth_75", {
      page: page,
      scroll_depth: 75,
      time_to_scroll_ms: timeToScroll || 0,
      content_height: contentHeight || 0,
      scroll_speed: timeToScroll ? ((contentHeight || 0) / timeToScroll) * 1000 : 0,
      engagement_indicator: "high_scroll",
      ...getCommonParameters(),
    })
  },

  timeOnPage5Min: (page: string, exactTime?: number, interactionCount?: number) => {
    trackEvent("BEHAVIOR_time_on_page_5min", {
      page: page,
      exact_time_ms: exactTime || 300000,
      interaction_count: interactionCount || 0,
      engagement_quality: interactionCount && interactionCount > 5 ? "active" : "passive",
      engagement_indicator: "long_session",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },

  multipleQuestions: (questionCount: number, sessionDuration?: number, topicVariety?: number) => {
    trackEvent("BEHAVIOR_multiple_questions", {
      question_count: questionCount,
      session_duration_ms: sessionDuration || 0,
      topic_variety: topicVariety || 1,
      avg_question_interval: sessionDuration ? sessionDuration / questionCount : 0,
      engagement_indicator: "high_curiosity",
      user_intent: questionCount > 10 ? "deep_exploration" : "casual_inquiry",
      ...getCommonParameters(),
      ...getUserContext(),
    })
  },
}

export const trackPerformanceEvents = {
  pageLoadSlow: (page: string, loadTime: number, connectionType?: string, deviceType?: string) => {
    trackEvent("PERFORMANCE_page_load_slow", {
      page: page,
      load_time_ms: loadTime,
      connection_type: connectionType || "unknown",
      device_type: deviceType || (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop"),
      performance_threshold: 3000, // 3초 기준
      performance_impact: loadTime > 5000 ? "high" : "medium",
      user_experience_score: Math.max(0, 100 - loadTime / 100), // 간단한 UX 점수
      ...getCommonParameters(),
    })
  },

  apiResponseSlow: (endpoint: string, responseTime: number, statusCode?: number) => {
    trackEvent("PERFORMANCE_api_response_slow", {
      endpoint: endpoint,
      response_time_ms: responseTime,
      status_code: statusCode || 200,
      performance_threshold: 2000, // 2초 기준
      performance_impact: responseTime > 5000 ? "high" : "medium",
      ...getCommonParameters(),
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
