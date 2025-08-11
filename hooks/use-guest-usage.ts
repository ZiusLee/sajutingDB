"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

const STORAGE_KEY_COUNT = "guest_usage_count"
const STORAGE_KEY_RESET_AT = "guest_usage_reset_at"
const SESSION_KEY_VISIT = "guest_usage_incremented_this_visit"

/**
 * Guest usage limiter hook.
 * - Counts "uses" for guests via localStorage.
 * - Resets daily (based on local time).
 * - Increments once per page visit (unless you call increment() manually).
 */
export function useGuestUsage(limit = 5) {
  const [count, setCount] = useState<number>(0)

  // Reset count if day changed
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const savedResetAt = localStorage.getItem(STORAGE_KEY_RESET_AT)
      if (savedResetAt !== today) {
        localStorage.setItem(STORAGE_KEY_RESET_AT, today)
        localStorage.setItem(STORAGE_KEY_COUNT, "0")
        setCount(0)
        sessionStorage.removeItem(SESSION_KEY_VISIT)
      } else {
        const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || "0", 10)
        setCount(Number.isFinite(saved) ? saved : 0)
      }
    } catch {
      // ignore
    }
  }, [])

  const incrementOncePerVisit = useCallback(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY_VISIT) === "true") return
      sessionStorage.setItem(SESSION_KEY_VISIT, "true")
      const current = Number.parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || "0", 10) || 0
      const next = current + 1
      localStorage.setItem(STORAGE_KEY_COUNT, String(next))
      setCount(next)
    } catch {
      // ignore
    }
  }, [])

  const increment = useCallback(() => {
    try {
      const current = Number.parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || "0", 10) || 0
      const next = current + 1
      localStorage.setItem(STORAGE_KEY_COUNT, String(next))
      setCount(next)
    } catch {
      // ignore
    }
  }, [])

  const reset = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COUNT, "0")
      setCount(0)
      sessionStorage.removeItem(SESSION_KEY_VISIT)
    } catch {
      // ignore
    }
  }, [])

  const isOverLimit = useMemo(() => count >= limit, [count, limit])

  return {
    count,
    limit,
    isOverLimit,
    increment,
    incrementOncePerVisit,
    reset,
  }
}
