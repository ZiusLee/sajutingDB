'use client'

import { Building2, BadgeIcon as IdCard, MapPin, Phone, CalendarDays, Landmark } from 'lucide-react'

type BusinessFooterProps = {
  companyName?: string
  representativeName?: string
  businessNumber?: string
  address?: string
  businessTypes?: string[]
  businessItems?: string[]
  openingDate?: string
  issueDate?: string
  taxOffice?: string
  taxType?: string
  phoneNote?: string
  taxInvoiceEmail?: string
}

/**
 * 사업자 정보 푸터
 * - 법적 고지 정보를 일관되게 노출하는 컴포넌트
 * - props를 전달하지 않으면 기본값(요청에서 제공한 정보)으로 렌더링됩니다.
 */
export default function BusinessFooter({
  companyName = '원테라피',
  representativeName = '이윤섭',
  businessNumber = '180-16-02886',
  address = '경기도 파주시 파주읍 약수골길 86',
  businessTypes = ['정보통신업', '서비스업'],
  businessItems = [
    '응용소프트웨어 개발 및 공급업',
    '포털 및 기타 인터넷 정보 매개 서비스업',
    '점술 및 유사 서비스업',
  ],
  openingDate = '2025-08-06',
  issueDate = '2025-08-06',
  taxOffice = '파주세무서',
  taxType = '간이과세자',
  phoneNote = '연락처는 070, 0505, 전국대표번호, 080, 휴대폰번호 유형 등록이 가능합니다.',
  taxInvoiceEmail = '-',
}: BusinessFooterProps) {
  return (
    <footer
      className="w-full border-t bg-gray-50 text-gray-700"
      aria-label="사업자 정보"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-900">사업자 정보</h2>
          <p className="mt-1 text-xs text-gray-500">
            본 페이지 하단의 정보는 전자상거래 등에서의 소비자보호에 관한 법률에 따라 표기됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <dl className="space-y-3">
            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <Building2 className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">상호명</span>
                <span className="ml-2">{companyName}</span>
                <span className="ml-2 inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                  사업자등록증 ({taxType})
                </span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <IdCard className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">대표자명</span>
                <span className="ml-2">{representativeName}</span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <IdCard className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">사업자등록번호</span>
                <span className="ml-2 tabular-nums tracking-wide">{businessNumber}</span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <MapPin className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">사업장 주소</span>
                <span className="ml-2">{address}</span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <Phone className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">연락처</span>
                <span className="ml-2 text-gray-600">{phoneNote}</span>
              </dd>
            </div>
          </dl>

          {/* Right column */}
          <dl className="space-y-3">
            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <Building2 className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">업태</span>
                <span className="ml-2">{businessTypes.join(', ')}</span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <Building2 className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">종목</span>
                <ul className="mt-1 ml-2 list-disc pl-4 text-gray-700">
                  {businessItems.map((item, idx) => (
                    <li key={idx} className="text-sm">{item}</li>
                  ))}
                </ul>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <CalendarDays className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">개업연월일</span>
                <span className="ml-2 tabular-nums">{openingDate}</span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <Landmark className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">발급기관/발급일</span>
                <span className="ml-2">{taxOffice}</span>
                <span className="ml-2 text-gray-500 tabular-nums">({issueDate})</span>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="shrink-0 mt-0.5 text-gray-500">
                <IdCard className="size-4" aria-hidden="true" />
              </dt>
              <dd className="text-sm">
                <span className="font-medium text-gray-900">전자세금계산서 전용 이메일</span>
                <span className="ml-2">{taxInvoiceEmail}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 text-[11px] leading-5 text-gray-500">
          <p>
            본 정보는 사업자등록증 기준으로 표기되었습니다. 추가 문의는 고객센터 또는 전자메일로 연락 바랍니다.
          </p>
        </div>
      </div>
    </footer>
  )
}
