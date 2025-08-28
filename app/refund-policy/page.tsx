import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "환불 및 유료 이용약관 - 사주핑",
  description: "사주핑 유료서비스 환불 정책 및 이용약관 안내",
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6">
          <Link
            href="/charge"
            className="text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4"
            aria-label="구독 관리 페이지로 돌아가기"
          >
            {"← 구독 관리 페이지로 돌아가기"}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold">{"사주핑 유료 이용약관"}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[80vh] overflow-y-auto">
            <div className="prose prose-neutral max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                <strong>공고일자:</strong> 2025년 8월 22일
                <br />
                <strong>시행일자:</strong> 2025년 8월 22일
              </p>

              <section aria-labelledby="chapter-1" className="space-y-4">
                <h2 id="chapter-1" className="text-xl font-semibold border-b pb-2">
                  {"제1장 총칙"}
                </h2>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제1조 (목적)"}</h3>
                  <p>
                    본 약관은 회원이 사주핑 서비스 내 유료서비스를 이용함에 있어 회사와 회원의 권리·의무 및 이용조건을
                    규정합니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제2조 (정의)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>회원:</strong> 유료서비스를 이용하는 자
                    </li>
                    <li>
                      <strong>유료서비스:</strong> 회사가 유료로 제공하는 디지털콘텐츠
                    </li>
                    <li>
                      <strong>질문권:</strong> 구독 또는 별도 유상 결제를 통해 지급되는 디지털 이용권(사주 해석·상담
                      등에 사용)
                    </li>
                    <li>
                      <strong>보너스 질문권:</strong> 무상 제공되는 이용권(환불 불가)
                    </li>
                    <li>
                      <strong>구독:</strong> 정기적으로 자동 결제되는 유료서비스
                    </li>
                    <li>
                      <strong>일회성 결제:</strong> 단발성으로 이루어지는 유료서비스 결제
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제3조 (적용)"}</h3>
                  <p>회원이 유료서비스를 결제하면 본 약관에 동의한 것으로 봅니다.</p>
                </div>
              </section>

              <Separator className="my-6" />

              <section aria-labelledby="chapter-2" className="space-y-4">
                <h2 id="chapter-2" className="text-xl font-semibold border-b pb-2">
                  {"제2장 유료서비스 이용"}
                </h2>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제4조 (서비스 안내)"}</h3>
                  <p>회사는 서비스명, 가격, 이용기간, 제공 내용을 앱 화면에 명확히 표시합니다.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제4조의2 (질문권 유효기간)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>유료로 구매한 질문권의 유효기간은 구매일로부터 1년입니다.</li>
                    <li>유효기간이 경과한 질문권은 자동으로 소멸되며, 이에 대한 환불이나 연장은 제공되지 않습니다.</li>
                    <li>
                      보너스 질문권의 유효기간은 별도로 안내되는 기간에 따르며, 명시되지 않은 경우 구매한 질문권과
                      동일한 유효기간이 적용됩니다.
                    </li>
                    <li>회원은 앱 내에서 보유 중인 질문권의 유효기간을 확인할 수 있습니다.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제5조 (계약성립)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>결제 완료 시 이용계약이 성립합니다.</li>
                    <li>구독 서비스의 경우 최초 결제 완료 시점부터 서비스 이용이 개시됩니다.</li>
                    <li>일회성 결제의 경우 결제 완료와 동시에 해당 서비스 이용권이 부여됩니다.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제6조 (미성년자 보호)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>미성년자가 유료서비스를 이용하고자 하는 경우 법정대리인의 동의가 필요합니다.</li>
                    <li>법정대리인은 미성년자의 유료서비스 이용을 철회하거나 취소할 수 있습니다.</li>
                    <li>
                      미성년자가 법정대리인의 동의 없이 결제한 경우, 미성년자 본인 또는 법정대리인이 계약을 취소할 수
                      있습니다.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제7조 (결제수단)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>신용카드, 체크카드</li>
                    <li>계좌이체</li>
                    <li>휴대폰 결제</li>
                    <li>인앱결제 (App Store, Google Play)</li>
                    <li>기타 회사가 제공하는 결제수단</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제8조 (청약철회 및 환불 제한)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      구독형 유료서비스는 결제와 동시에 이용이 개시되므로, 결제 완료 후에는 원칙적으로 청약철회(환불)가
                      불가합니다.
                    </li>
                    <li>디지털콘텐츠의 특성상 이용이 개시된 후에는 환불이 제한됩니다.</li>
                    <li>
                      단, 관계 법령상 환불 의무가 있는 경우(과오금 결제, 서비스 장애 등)에는 해당 법령에 따라
                      처리합니다.
                    </li>
                    <li>회사의 귀책사유로 인한 서비스 제공 불가 시에는 전액 환불합니다.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제9조 (환불정책)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      구독은 결제 시점부터 즉시 효력이 발생하며, 결제일로부터 1일이라도 경과하거나 질문권을 사용한 경우
                      환불이 불가합니다.
                    </li>
                    <li>부분 환불, 잔여기간 환불, 잔여 질문권 환불은 제공되지 않습니다.</li>
                    <li>보너스 질문권은 환불되지 않습니다.</li>
                    <li>환불 시 결제수수료, 부가세 등을 제외한 실결제금액을 기준으로 합니다.</li>
                    <li>
                      환불은 원칙적으로 원래 결제수단으로 처리되며, 불가능한 경우 별도 안내 후 다른 방법으로 처리합니다.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제9조의2 (요금제 변경에 따른 환불정책)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      상위 요금제로 변경 시 기존 요금제의 잔여기간 및 잔여 질문권은 즉시 소멸되며 환불되지 않습니다.
                    </li>
                    <li>
                      하위 요금제로 변경 요청 시 변경은 다음 결제일부터 적용되며 그 이전에 결제된 요금은 환불되지
                      않습니다.
                    </li>
                    <li>변경 신청 후 서비스 이용을 중단하더라도 이미 결제된 요금은 환불되지 않습니다.</li>
                    <li>요금제 변경은 회원이 직접 앱 내에서 신청하거나 고객센터를 통해 요청할 수 있습니다.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제10조 (보너스 질문권 및 프로모션)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>보너스 질문권은 유효기간 경과 또는 탈퇴 시 소멸되며 환불되지 않습니다.</li>
                    <li>프로모션을 통해 제공되는 혜택은 해당 프로모션 조건에 따라 제한될 수 있습니다.</li>
                    <li>부정한 방법으로 획득한 보너스 질문권은 회수될 수 있습니다.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제11조 (과오금 처리)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>과오금은 동일 결제수단으로 환불하며 불가 시 별도 안내 후 처리합니다.</li>
                    <li>과오금 환불 시 금융기관 수수료가 발생하는 경우 회사가 부담합니다.</li>
                    <li>과오금 발생 시 회원은 즉시 회사에 신고하여야 하며, 회사는 확인 후 신속히 환불 처리합니다.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제12조 (자동결제 및 해지)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>구독 서비스는 결제일을 기준으로 매월/매년 자동 갱신됩니다.</li>
                    <li>이용자가 갱신을 원하지 않는 경우, 차기 결제일 이전에 반드시 해지 신청을 해야 합니다.</li>
                    <li>해지 신청은 앱 내 설정 메뉴 또는 고객센터를 통해 가능합니다.</li>
                    <li>해지 신청 후에도 현재 결제 주기가 끝날 때까지는 서비스를 이용할 수 있습니다.</li>
                    <li>결제 완료 후에는 해당 주기에 대한 환불이 되지 않습니다.</li>
                  </ul>
                </div>
              </section>

              <Separator className="my-6" />

              <section aria-labelledby="chapter-3" className="space-y-4">
                <h2 id="chapter-3" className="text-xl font-semibold border-b pb-2">
                  {"제3장 기타"}
                </h2>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제13조 (책임 제한)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>회사는 천재지변, 전쟁, 파업, 정부의 규제 등 불가항력 상황에 대해 책임지지 않습니다.</li>
                    <li>
                      회사가 제공하는 모든 유료 및 무료 콘텐츠는 참고용으로 제공되는 것이며, 법적·의료적·재정적 자문에
                      해당하지 않습니다.
                    </li>
                    <li>이용자는 서비스 이용 결과에 대해 본인이 책임을 집니다.</li>
                    <li>
                      회사는 이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 개입할 의무가 없으며 이로 인한 손해를
                      배상할 책임이 없습니다.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제14조 (콘텐츠 및 계정 소유권)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      서비스 내에서 제공되는 모든 콘텐츠 및 데이터에 대한 저작권과 지식재산권은 회사에 귀속됩니다.
                    </li>
                    <li>
                      이용자가 서비스를 통해 작성하거나 입력한 데이터는 회사의 서비스 개선 및 연구 목적으로 활용될 수
                      있습니다.
                    </li>
                    <li>
                      이용자는 회사의 사전 동의 없이 서비스의 콘텐츠를 복제, 전송, 배포, 상업적 이용할 수 없습니다.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{"제15조 (준거법 및 관할법원)"}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>본 약관은 대한민국 법률을 준거법으로 합니다.</li>
                    <li>
                      서비스 이용과 관련하여 회사와 이용자 간 발생하는 분쟁은 민사소송법에 따른 대한민국 법원을
                      전속관할법원으로 합니다.
                    </li>
                    <li>소액 분쟁의 경우 소비자분쟁조정위원회의 조정을 우선적으로 고려할 수 있습니다.</li>
                  </ul>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/charge"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            aria-label="구독 관리 페이지로 이동"
          >
            {"구독 관리 페이지로 돌아가기"}
          </Link>
        </div>
      </div>
    </main>
  )
}
