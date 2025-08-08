'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

interface AnalyticsWrapperProps {
  children: React.ReactNode
}

export default function AnalyticsWrapper({ children }: AnalyticsWrapperProps) {
  const pathname = usePathname()

  useEffect(() => {
    // 페이지 변경 시 Google Analytics에 페이지 뷰 추적
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])

  return <>{children}</>
}
