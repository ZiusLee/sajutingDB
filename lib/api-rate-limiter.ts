import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: Date | null
  reason?: string
}

/**
 * API 호출 제한을 확인하는 함수
 * @param userId 사용자 ID
 * @param endpoint API 엔드포인트
 * @param ipAddress IP 주소
 * @param userAgent 사용자 에이전트
 * @returns 허용 여부 및 관련 정보
 */
export async function checkRateLimit(
  userId: string | null,
  endpoint: string,
  ipAddress: string,
  userAgent: string,
): Promise<RateLimitResult> {
  const supabase = createClient(cookies())

  // 차단된 사용자 확인
  if (userId) {
    const { data: blockedUser } = await supabase.from("blocked_users").select("*").eq("user_id", userId).maybeSingle()

    if (blockedUser) {
      const isPermanent = blockedUser.is_permanent
      const blockedUntil = blockedUser.blocked_until ? new Date(blockedUser.blocked_until) : null

      if (isPermanent || (blockedUntil && blockedUntil > new Date())) {
        return {
          allowed: false,
          remaining: 0,
          limit: 0,
          resetAt: blockedUntil,
          reason: blockedUser.reason,
        }
      }
    }
  }

  // API 제한 설정 가져오기
  const { data: apiLimit } = await supabase.from("api_limits").select("*").eq("endpoint", endpoint).maybeSingle()

  if (!apiLimit) {
    // 기본 제한 설정
    return {
      allowed: true,
      remaining: 10,
      limit: 10,
      resetAt: null,
    }
  }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const hourStart = new Date(now)
  hourStart.setMinutes(0, 0, 0)

  // 오늘 사용량 확인
  let query = supabase.from("api_usage").select("*", { count: "exact" }).gte("timestamp", todayStart.toISOString())

  if (userId) {
    query = query.eq("user_id", userId)
  } else {
    query = query.eq("ip_address", ipAddress)
  }

  query = query.eq("endpoint", endpoint)

  const { count: dailyCount } = await query

  // 시간당 사용량 확인
  query = supabase.from("api_usage").select("*", { count: "exact" }).gte("timestamp", hourStart.toISOString())

  if (userId) {
    query = query.eq("user_id", userId)
  } else {
    query = query.eq("ip_address", ipAddress)
  }

  query = query.eq("endpoint", endpoint)

  const { count: hourlyCount } = await query

  // 일일 제한 확인
  if (dailyCount && dailyCount >= apiLimit.daily_limit) {
    const tomorrow = new Date(todayStart)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      allowed: false,
      remaining: 0,
      limit: apiLimit.daily_limit,
      resetAt: tomorrow,
      reason: "일일 API 호출 제한 초과",
    }
  }

  // 시간당 제한 확인
  if (hourlyCount && hourlyCount >= apiLimit.hourly_limit) {
    const nextHour = new Date(hourStart)
    nextHour.setHours(nextHour.getHours() + 1)

    return {
      allowed: false,
      remaining: 0,
      limit: apiLimit.hourly_limit,
      resetAt: nextHour,
      reason: "시간당 API 호출 제한 초과",
    }
  }

  // 비정상적인 패턴 감지 (예: 짧은 시간 내 여러 요청)
  const fiveMinutesAgo = new Date(now)
  fiveMinutesAgo.setMinutes(now.getMinutes() - 5)

  query = supabase.from("api_usage").select("*", { count: "exact" }).gte("timestamp", fiveMinutesAgo.toISOString())

  if (userId) {
    query = query.eq("user_id", userId)
  } else {
    query = query.eq("ip_address", ipAddress)
  }

  query = query.eq("endpoint", endpoint)

  const { count: recentCount } = await query

  // 5분 내 10회 이상 요청 시 비정상으로 간주
  if (recentCount && recentCount >= 10) {
    // 사용자 차단
    if (userId) {
      const thirtyMinutesLater = new Date(now)
      thirtyMinutesLater.setMinutes(now.getMinutes() + 30)

      await supabase.from("blocked_users").upsert({
        user_id: userId,
        reason: "비정상적인 API 사용 패턴 감지",
        blocked_until: thirtyMinutesLater.toISOString(),
        is_permanent: false,
        updated_at: now.toISOString(),
      })
    }

    return {
      allowed: false,
      remaining: 0,
      limit: apiLimit.hourly_limit,
      resetAt: new Date(now.getTime() + 30 * 60000), // 30분 후
      reason: "비정상적인 API 사용 패턴 감지",
    }
  }

  return {
    allowed: true,
    remaining: apiLimit.daily_limit - (dailyCount || 0),
    limit: apiLimit.daily_limit,
    resetAt: null,
  }
}

/**
 * API 사용 기록을 저장하는 함수
 * @param userId 사용자 ID
 * @param endpoint API 엔드포인트
 * @param ipAddress IP 주소
 * @param userAgent 사용자 에이전트
 * @param requestParams 요청 파라미터
 * @param responseStatus 응답 상태 코드
 * @param responseTime 응답 시간 (밀리초)
 * @param costUnits 비용 단위
 */
export async function logApiUsage(
  userId: string | null,
  endpoint: string,
  ipAddress: string,
  userAgent: string,
  requestParams: any = {},
  responseStatus = 200,
  responseTime = 0,
  costUnits = 1,
): Promise<void> {
  const supabase = createClient(cookies())

  await supabase.from("api_usage").insert({
    user_id: userId,
    endpoint,
    ip_address: ipAddress,
    user_agent: userAgent,
    request_params: requestParams,
    response_status: responseStatus,
    response_time: responseTime,
    cost_units: costUnits,
  })
}
