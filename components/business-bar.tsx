'use client'

type BusinessBarProps = {
  companyName: string
  representative: string
  businessNumber: string
  address: string
  phone: string
  className?: string
}

/**
 * 간결한 사업자 정보 하단 바 (고정)
 * - 작은 높이, 가로 레이아웃, 작은 텍스트
 * - 모바일에서는 자동 줄바꿈
 */
export default function BusinessBar({
  companyName,
  representative,
  businessNumber,
  address,
  phone,
  className = '',
}: BusinessBarProps) {
  return (
    <footer
      role="contentinfo"
      aria-label="사업자 기본 정보"
      className={`fixed bottom-0 left-0 right-0 border-t bg-white/90 text-gray-700 backdrop-blur supports-[backdrop-filter]:bg-white/60 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-3 md:px-4 py-1.5 md:py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] md:text-xs leading-5">
          <span className="font-medium text-gray-900">상호명</span>
          <span>{companyName}</span>
          <span className="text-gray-300" aria-hidden="true">|</span>

          <span className="font-medium text-gray-900">대표자명</span>
          <span>{representative}</span>
          <span className="text-gray-300" aria-hidden="true">|</span>

          <span className="font-medium text-gray-900">사업자등록번호</span>
          <span className="tabular-nums tracking-wide">{businessNumber}</span>
          <span className="text-gray-300" aria-hidden="true">|</span>

          <span className="font-medium text-gray-900">사업장 주소</span>
          <span className="truncate max-w-[40ch] md:max-w-none">{address}</span>
          <span className="text-gray-300" aria-hidden="true">|</span>

          <span className="font-medium text-gray-900">전화번호</span>
          <a
            href="tel:01056144801"
            className="underline-offset-2 hover:underline text-gray-800"
          >
            {phone}
          </a>
        </div>
      </div>
    </footer>
  )
}
