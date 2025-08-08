'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

export default function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 페이지 변경 시 추적
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    const title = document.title
    
    // 페이지 로드 후 약간의 지연을 두고 추적 (GA 스크립트 로드 대기)
    const timer = setTimeout(() => {
      trackPageView(url, title)
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return <>{children}</>
}
