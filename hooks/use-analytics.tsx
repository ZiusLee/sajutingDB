"use client"

import type React from "react"
import {
  useAutoTracking,
  useFormTracking,
  useChatTracking,
  usePerformanceTracking,
  usePageAnalytics,
  type PAGE_TRACKING_CONFIG,
} from "@/lib/analytics"

export { useAutoTracking, useFormTracking, useChatTracking, usePerformanceTracking, usePageAnalytics }

export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  pageName: keyof typeof PAGE_TRACKING_CONFIG,
) {
  return function AnalyticsWrappedComponent(props: P) {
    const analytics = usePageAnalytics(pageName)

    return <Component {...props} analytics={analytics} />
  }
}

export function AutoTrackingProvider({
  children,
  pageName,
}: {
  children: React.ReactNode
  pageName: keyof typeof PAGE_TRACKING_CONFIG
}) {
  usePageAnalytics(pageName)
  return <>{children}</>
}
