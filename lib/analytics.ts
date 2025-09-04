"use client"

import { sendGAEvent } from "@next/third-parties/google"
import React from "react"
import { createBrowserClient } from "@supabase/ssr"

declare global {
  interface Window {
    amplitude?: any
    gtag?: any
  }
}

const createSupabaseClient = () => {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const getUserAge = async (userId?: string): Promise<number | null> => {
  if (!userId || typeof window === "undefined") return null

  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.from("birth_info").select("solar_year").eq("user_id", userId).single()

    if (error || !data?.solar_year) {
      console.log("Birth info not found for user:", userId)
      return null
    }

    const currentYear = new Date().getFullYear()
    const age = currentYear - data.solar_year

    return age >= 0 && age <= 120 ? age : null
  } catch (error) {
    console.error("Error fetching user age:", error)
    return null
  }
}

const getAgeGroup = (age: number | null): string => {
  if (!age) return "unknown"

  if (age < 18) return "under_18"
  if (age < 25) return "18_24"
  if (age < 35) return "25_34"
  if (age < 45) return "35_44"
  if (age < 55) return "45_54"
  if (age < 65) return "55_64"
  return "65_plus"
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

const getUserContext = async (userId?: string) => {
  if (typeof window === "undefined") return {}

  const visitCount = Number.parseInt(localStorage.getItem("visit_count") || "0")
  const firstVisit = localStorage.getItem("first_visit_date")
  const lastVisit = localStorage.getItem("last_visit_date")

  const age = await getUserAge(userId)
  const ageGroup = getAgeGroup(age)

  return {
    visit_count: visitCount,
    is_returning_user: visitCount > 1,
    first_visit_date: firstVisit,
    last_visit_date: lastVisit,
    days_since_first_visit: firstVisit
      ? Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    user_age: age,
    age_group: ageGroup,
  }
}

export const trackIntegratedEvents = {
  pageView: (page: "home" | "login" | "register" | "mypage" | "saju_chat" | "onboarding") => {
    trackEvent("page_view", {
      page: page,
      timestamp: new Date().toISOString(),
    })
  },

  loginClick: (method: "kakao" | "email" | "google") => {
    trackEvent("login_click", {
      method: method,
      timestamp: new Date().toISOString(),
    })
  },

  registerClick: () => {
    trackEvent("register_click", {
      timestamp: new Date().toISOString(),
    })
  },

  buttonClick: (buttonId: "logout" | "saju_create" | "new_chat") => {
    trackEvent("button_click", {
      button_id: buttonId,
      timestamp: new Date().toISOString(),
    })
  },

  formSubmit: (form: "login" | "register" | "chat_message" | "password_reset") => {
    trackEvent("form_submit", {
      form: form,
      timestamp: new Date().toISOString(),
    })
  },

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
  messageSent: async (
    messageLength: number,
    roomType?: string,
    messageType?: "question" | "followup" | "clarification",
    userId?: string,
  ) => {
    const userContext = await getUserContext(userId)

    trackEvent("AI_message_sent", {
      message_length: messageLength,
      message_character_count: messageLength,
      room_type: roomType,
      message_type: messageType,
      conversation_turn: Number.parseInt(sessionStorage.getItem("conversation_turn") || "1"),
      session_duration: Date.now() - Number.parseInt(sessionStorage.getItem("session_start") || "0"),
      ...getCommonParameters(),
      ...userContext,
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

  conversationCompleted: async (totalMessages: number, totalDuration: number, roomType?: string, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("AI_conversation_completed", {
      total_messages: totalMessages,
      total_duration_ms: totalDuration,
      room_type: roomType,
      avg_message_length: 0,
      ...getCommonParameters(),
      ...userContext,
    })
  },
}

export const trackUserEvents = {
  sessionStart: async (entryPoint?: string, utmSource?: string, userId?: string) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("session_id", sessionId)
    sessionStorage.setItem("session_start", Date.now().toString())

    const visitCount = Number.parseInt(localStorage.getItem("visit_count") || "0") + 1
    localStorage.setItem("visit_count", visitCount.toString())
    localStorage.setItem("last_visit_date", new Date().toISOString())

    if (visitCount === 1) {
      localStorage.setItem("first_visit_date", new Date().toISOString())
    }

    const userContext = await getUserContext(userId)

    trackEvent("USER_session_start", {
      session_id: sessionId,
      entry_point: entryPoint || "direct",
      utm_source: utmSource,
      is_first_session: visitCount === 1,
      visit_number: visitCount,
      device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
      ...getCommonParameters(),
      ...userContext,
    })

    await checkAndTrackRetentionMilestones(userContext.days_since_first_visit, visitCount, userId)
  },

  firstVisit: async (acquisitionChannel?: string, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("USER_first_visit", {
      acquisition_channel: acquisitionChannel || "organic",
      landing_page: window.location.pathname,
      ...getCommonParameters(),
      ...userContext,
    })
  },

  returnVisit: async (daysSinceLastVisit?: number, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("USER_return_visit", {
      days_since_last_visit: daysSinceLastVisit || 0,
      return_frequency: daysSinceLastVisit && daysSinceLastVisit < 7 ? "frequent" : "occasional",
      ...getCommonParameters(),
      ...userContext,
    })

    await checkAndTrackRetentionMilestones(userContext.days_since_first_visit, userContext.visit_count, userId)
  },

  profileCreated: async (profileCompleteness?: number, creationMethod?: "onboarding" | "manual", userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("USER_profile_created", {
      profile_completeness: profileCompleteness || 0,
      creation_method: creationMethod || "onboarding",
      time_to_create: Date.now() - Number.parseInt(sessionStorage.getItem("session_start") || "0"),
      ...getCommonParameters(),
      ...userContext,
    })
  },

  engagementHigh: async (duration: number, interactionCount?: number, pageDepth?: number, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("USER_engagement_high", {
      session_duration: duration,
      interaction_count: interactionCount || 0,
      page_depth: pageDepth || 1,
      engagement_score: Math.min(100, (duration / 1000 / 60) * 10 + (interactionCount || 0) * 5),
      ...getCommonParameters(),
      ...userContext,
    })
  },

  chatSessionStart: async (roomType: string, isFirstChat?: boolean, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("USER_chat_session_start", {
      room_type: roomType,
      is_first_chat: isFirstChat || false,
      chat_session_id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_onboarding_completed: localStorage.getItem("onboarding_completed") === "true",
      ...getCommonParameters(),
      ...userContext,
    })
  },

  memoryBankAccessed: async (accessType?: "search" | "browse" | "direct", searchQuery?: string, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("USER_memory_bank_accessed", {
      access_type: accessType || "direct",
      search_query: searchQuery,
      memory_bank_size: 0,
      ...getCommonParameters(),
      ...userContext,
    })
  },
}

export const trackConversionEvents = {
  sajuProfileComplete: async (completionTime?: number, profileAccuracy?: number, userId?: string) => {
    const userContext = await getUserContext(userId)

    trackEvent("CONVERSION_saju_profile_complete", {
      completion_time_ms: completionTime || 0,
      profile_accuracy: profileAccuracy || 0,
      conversion_step: "profile_creation",
      funnel_stage: "activation",
      time_to_conversion: Date.now() - Number.parseInt(sessionStorage.getItem("session_start") || "0"),
      ...getCommonParameters(),
      ...userContext,
    })
  },

  firstChatComplete: async (
    chatDuration?: number,
    messageCount?: number,
    satisfactionScore?: number,
    userId?: string,
  ) => {
    const userContext = await getUserContext(userId)

    trackEvent("CONVERSION_first_chat_complete", {
      chat_duration_ms: chatDuration || 0,
      message_count: messageCount || 0,
      satisfaction_score: satisfactionScore || 0,
      conversion_step: "first_interaction",
      funnel_stage: "engagement",
      ...getCommonParameters(),
      ...userContext,
    })
  },

  userRetentionDay1: async (
    totalSessions?: number,
    totalChatTime?: number,
    featureUsage?: string[],
    userId?: string,
  ) => {
    const userContext = await getUserContext(userId)

    trackEvent("CONVERSION_user_retention_day1", {
      total_sessions: totalSessions || 0,
      total_chat_time_ms: totalChatTime || 0,
      features_used: featureUsage || [],
      retention_quality: totalSessions && totalSessions > 1 ? "high" : "low",
      conversion_step: "early_retention",
      funnel_stage: "engagement",
      retention_milestone: "day_1",
      ...getCommonParameters(),
      ...userContext,
    })
  },

  userRetentionDay3: async (
    totalSessions?: number,
    totalChatTime?: number,
    featureUsage?: string[],
    userId?: string,
  ) => {
    const userContext = await getUserContext(userId)

    trackEvent("CONVERSION_user_retention_day3", {
      total_sessions: totalSessions || 0,
      total_chat_time_ms: totalChatTime || 0,
      features_used: featureUsage || [],
      retention_quality: totalSessions && totalSessions > 2 ? "high" : "low",
      conversion_step: "mid_retention",
      funnel_stage: "habit_formation",
      retention_milestone: "day_3",
      ...getCommonParameters(),
      ...userContext,
    })
  },

  userRetentionDay7: async (
    totalSessions?: number,
    totalChatTime?: number,
    featureUsage?: string[],
    userId?: string,
  ) => {
    const userContext = await getUserContext(userId)

    trackEvent("CONVERSION_user_retention_day7", {
      total_sessions: totalSessions || 0,
      total_chat_time_ms: totalChatTime || 0,
      features_used: featureUsage || [],
      retention_quality: totalSessions && totalSessions > 3 ? "high" : "low",
      conversion_step: "retention",
      funnel_stage: "loyalty",
      retention_milestone: "day_7",
      ...getCommonParameters(),
      ...userContext,
    })
  },

  userRetentionDay30: async (
    totalSessions?: number,
    totalChatTime?: number,
    featureUsage?: string[],
    userId?: string,
  ) => {
    const userContext = await getUserContext(userId)

    trackEvent("CONVERSION_user_retention_day30", {
      total_sessions: totalSessions || 0,
      total_chat_time_ms: totalChatTime || 0,
      features_used: featureUsage || [],
      retention_quality: totalSessions && totalSessions > 5 ? "high" : "low",
      conversion_step: "long_term_retention",
      funnel_stage: "loyalty_established",
      retention_milestone: "day_30",
      ...getCommonParameters(),
      ...userContext,
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
      performance_threshold: 3000,
      performance_impact: loadTime > 5000 ? "high" : "medium",
      user_experience_score: Math.max(0, 100 - loadTime / 100),
      ...getCommonParameters(),
    })
  },

  apiResponseSlow: (endpoint: string, responseTime: number, statusCode?: number) => {
    trackEvent("PERFORMANCE_api_response_slow", {
      endpoint: endpoint,
      response_time_ms: responseTime,
      status_code: statusCode || 200,
      performance_threshold: 2000,
      performance_impact: responseTime > 5000 ? "high" : "medium",
      ...getCommonParameters(),
    })
  },
}

export const trackPageView = (url: string, title?: string) => {
  trackEvent("page_view", {
    page_location: url,
    page_title: title,
  })
}

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

export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent("exception", {
    description: errorMessage,
    fatal: false,
    location: errorLocation,
  })
}

export const trackCustomEvent = (eventName: string, parameters: Record<string, any>) => {
  trackEvent(eventName, {
    event_category: "custom",
    ...parameters,
  })
}

export const quickTrack = {
  enterPage: (page: "home" | "login" | "register" | "mypage" | "saju_chat" | "onboarding") => {
    trackIntegratedEvents.pageView(page)
  },

  attemptLogin: (method: "kakao" | "email" | "google") => {
    trackIntegratedEvents.loginClick(method)
  },

  sendChatMessage: (messageLength: number, roomType: string) => {
    trackIntegratedEvents.formSubmit("chat_message")
    trackAIEvents.messageSent(messageLength, roomType)

    const currentChatTime = Number.parseInt(localStorage.getItem("total_chat_time_ms") || "0")
    localStorage.setItem("total_chat_time_ms", (currentChatTime + 1000).toString()) // Approximate 1 second per message
  },

  completeSajuProfile: () => {
    trackConversionEvents.sajuProfileComplete()
    trackUserEvents.profileCreated()

    localStorage.setItem("has_created_saju_profile", "true")
  },

  completeOnboardingStep: (step: string) => {
    trackOnboardingDetailEvents.apiStatus("user_data_sync", "completed")
  },
}

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

export const trackOnboardingDetailEvents = {
  inputInteraction: (field: "name", action: "focused" | "blurred" | "typed" | "cleared") => {
    trackEvent("input_interaction", {
      field: field,
      action: action,
      timestamp: new Date().toISOString(),
    })
  },

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

  pageLoadEvent: (type: "onboarding_loaded" | "assets_loaded") => {
    trackEvent("page_load_event", {
      type: type,
      timestamp: new Date().toISOString(),
    })
  },

  apiStatus: (endpoint: "saju_calculation" | "user_data_sync", status: "started" | "completed" | "failed") => {
    trackEvent("api_status", {
      endpoint: endpoint,
      status: status,
      timestamp: new Date().toISOString(),
    })
  },
}

export const PAGE_TRACKING_CONFIG = {
  home: {
    events: ["USER_session_start", "USER_first_visit"],
    autoTrack: ["pageView", "scrollDepth", "timeOnPage"],
  },
  login: {
    events: ["login_attempt", "login_success", "login_error"],
    autoTrack: ["pageView", "formInteraction"],
  },
  register: {
    events: ["register_attempt", "register_success", "register_error"],
    autoTrack: ["pageView", "formInteraction"],
  },
  "saju-chat": {
    events: ["USER_chat_session_start", "AI_message_sent"],
    autoTrack: ["pageView", "chatInteraction"],
  },
  onboarding: {
    events: ["onboarding_started", "onboarding_step_completed"],
    autoTrack: ["pageView", "stepProgress"],
  },
  mypage: {
    events: ["USER_memory_bank_accessed", "profile_view"],
    autoTrack: ["pageView", "profileInteraction"],
  },
  result: {
    events: ["saju_result_view", "social_share"],
    autoTrack: ["pageView", "resultInteraction"],
  },
  payment: {
    events: ["begin_checkout", "purchase"],
    autoTrack: ["pageView", "paymentFlow"],
  },
} as const

export const useAutoTracking = (pageName: keyof typeof PAGE_TRACKING_CONFIG) => {
  const config = PAGE_TRACKING_CONFIG[pageName]

  React.useEffect(() => {
    if (config.autoTrack.includes("pageView")) {
      trackIntegratedEvents.pageView(pageName as any)
    }

    if (config.autoTrack.includes("scrollDepth")) {
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        if (scrollPercent >= 75) {
          trackBehaviorEvents.scrollDepth75(pageName)
          window.removeEventListener("scroll", handleScroll)
        }
      }
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }

    if (config.autoTrack.includes("timeOnPage")) {
      const startTime = Date.now()
      const timer = setTimeout(() => {
        trackBehaviorEvents.timeOnPage5Min(pageName, Date.now() - startTime)
      }, 300000)
      return () => clearTimeout(timer)
    }
  }, [pageName, config])

  return {
    trackPageEvent: (eventType: string, params?: Record<string, any>) => {
      if (config.events.includes(eventType as any)) {
        trackEvent(eventType, { page: pageName, ...params })
      }
    },
  }
}

export const useFormTracking = (formName: string) => {
  return {
    onSubmit: (success: boolean, errorMessage?: string) => {
      trackIntegratedEvents.formSubmit(formName as any)
      if (!success && errorMessage) {
        trackError(errorMessage, formName)
      }
    },
    onFieldFocus: (fieldName: string) => {
      trackEvent("form_field_focus", { form: formName, field: fieldName })
    },
    onFieldBlur: (fieldName: string, hasValue: boolean) => {
      trackEvent("form_field_blur", { form: formName, field: fieldName, has_value: hasValue })
    },
  }
}

export const useChatTracking = (roomType: string) => {
  const [sessionStarted, setSessionStarted] = React.useState(false)

  React.useEffect(() => {
    if (!sessionStarted) {
      trackUserEvents.chatSessionStart(roomType, true)
      setSessionStarted(true)
    }
  }, [roomType, sessionStarted])

  return {
    trackMessage: (messageLength: number, messageType?: "question" | "followup") => {
      trackAIEvents.messageSent(messageLength, roomType, messageType)
    },
    trackResponse: (responseLength: number, responseTime: number) => {
      trackAIEvents.responseReceived(responseLength, responseTime, roomType)
    },
    trackFeedback: (rating: "positive" | "negative") => {
      trackChatEvents.provideFeedback(rating)
    },
  }
}

export const usePerformanceTracking = (pageName: string) => {
  React.useEffect(() => {
    const startTime = performance.now()

    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      if (loadTime > 3000) {
        trackPerformanceEvents.pageLoadSlow(pageName, loadTime)
      }
    }

    if (document.readyState === "complete") {
      handleLoad()
    } else {
      window.addEventListener("load", handleLoad)
      return () => window.removeEventListener("load", handleLoad)
    }
  }, [pageName])
}

export const usePageAnalytics = (pageName: keyof typeof PAGE_TRACKING_CONFIG) => {
  const autoTracking = useAutoTracking(pageName)
  usePerformanceTracking(pageName)

  return {
    ...autoTracking,
    form: useFormTracking,
    chat: useChatTracking,
  }
}

const checkAndTrackRetentionMilestones = async (daysSinceFirstVisit: number, visitCount: number, userId?: string) => {
  if (typeof window === "undefined") return

  const trackedMilestones = JSON.parse(localStorage.getItem("retention_milestones_tracked") || "{}")

  // Get user's feature usage from localStorage
  const getFeatureUsage = (): string[] => {
    const features: string[] = []
    if (localStorage.getItem("has_completed_first_chat")) features.push("chat")
    if (localStorage.getItem("has_created_saju_profile")) features.push("saju_profile")
    if (localStorage.getItem("has_used_memory_bank")) features.push("memory_bank")
    if (localStorage.getItem("has_shared_result")) features.push("social_share")
    return features
  }

  const featureUsage = getFeatureUsage()
  const totalChatTime = Number.parseInt(localStorage.getItem("total_chat_time_ms") || "0")

  // Day 1 retention (24-48 hours after first visit)
  if (daysSinceFirstVisit >= 1 && daysSinceFirstVisit < 2 && !trackedMilestones.day1 && visitCount > 1) {
    await trackConversionEvents.userRetentionDay1(visitCount, totalChatTime, featureUsage, userId)
    trackedMilestones.day1 = true
    localStorage.setItem("retention_milestones_tracked", JSON.stringify(trackedMilestones))
  }

  // Day 3 retention (72-96 hours after first visit)
  if (daysSinceFirstVisit >= 3 && daysSinceFirstVisit < 4 && !trackedMilestones.day3 && visitCount > 1) {
    await trackConversionEvents.userRetentionDay3(visitCount, totalChatTime, featureUsage, userId)
    trackedMilestones.day3 = true
    localStorage.setItem("retention_milestones_tracked", JSON.stringify(trackedMilestones))
  }

  // Day 7 retention (7-8 days after first visit)
  if (daysSinceFirstVisit >= 7 && daysSinceFirstVisit < 8 && !trackedMilestones.day7 && visitCount > 1) {
    await trackConversionEvents.userRetentionDay7(visitCount, totalChatTime, featureUsage, userId)
    trackedMilestones.day7 = true
    localStorage.setItem("retention_milestones_tracked", JSON.stringify(trackedMilestones))
  }

  // Day 30 retention (30-31 days after first visit)
  if (daysSinceFirstVisit >= 30 && daysSinceFirstVisit < 31 && !trackedMilestones.day30 && visitCount > 1) {
    await trackConversionEvents.userRetentionDay30(visitCount, totalChatTime, featureUsage, userId)
    trackedMilestones.day30 = true
    localStorage.setItem("retention_milestones_tracked", JSON.stringify(trackedMilestones))
  }
}
