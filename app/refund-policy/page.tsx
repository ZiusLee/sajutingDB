import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "환불 및 유효기간 규정 - 사주핑",
  description: "사주핑 질문권 환불 및 유효기간 정책 안내",
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6">
          <Link
            href="/charge"
            className="text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4"
            aria-label="충전 페이지로 돌아가기"
          >
            {"← 충전(결제) 페이지로 돌아가기"}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold">{"환불 및 유효기간 규정"}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            <p className="text-neutral-600">{"사주핑 질문권 환불 및 유효기간에 대한 기준을 안내드립니다."}</p>

            <Separator className="my-6" />

            <section aria-labelledby="definitions" className="space-y-3">
              <h2 id="definitions" className="text-xl font-semibold">
                {"정의"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>질문권:</strong> 회원이 구독을 통해 부여받거나 추가 결제를 통해 충전하여, 사주
                  해석·상담·리포트 등 유료콘텐츠 이용 시 차감되는 디지털 이용권을 의미합니다. 질문권은 마지막
                  이용일로부터 5년 동안 사용하지 않을 경우 「상사소멸시효」에 따라 소멸될 수 있습니다.
                </li>
                <li>
                  <strong>보너스 질문권:</strong> 회사가 이벤트, 프로모션 등으로 무상 지급하는 질문권을 의미하며
                  환불되지 않습니다. 보너스 질문권은 유효기간은 회사 정책에 따릅니다. 유효기간 경과 시 자동 소멸되며,
                  소멸된 보너스 질문권은 환불 불가합니다.
                </li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-1" className="space-y-3">
              <h2 id="article-1" className="text-xl font-semibold">
                {"제1조 (전액 환불)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  "구독형 유료서비스는 결제와 동시에 이용이 개시되므로, 결제 완료 후에는 청약철회(환불)가 불가합니다."
                </li>
                <li>{"단, 관계 법령상 환불 의무가 있는 경우(과오금 결제 등)에는 해당 법령에 따라 처리합니다."}</li>
                <li>{"환불은 결제 시 사용한 동일한 결제 수단으로만 진행됩니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-2" className="space-y-3">
              <h2 id="article-2" className="text-xl font-semibold">
                {"제2조 (환불정책)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {
                    "구독은 결제 시점부터 즉시 효력이 발생하며, 결제일로부터 1일이라도 경과하거나 질문권을 사용한 경우 환불이 불가합니다."
                  }
                </li>
                <li>{"부분 환불, 잔여기간 환불, 잔여 질문권 환불은 제공되지 않습니다."}</li>
                <li>{"보너스 질문권은 환불되지 않습니다."}</li>
                <li>{"서비스 이용 중 이용자의 귀책사유로 계정이 정지·탈퇴된 경우 잔여 질문권은 환불되지 않습니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-2-2" className="space-y-3">
              <h2 id="article-2-2" className="text-xl font-semibold">
                {"제2조의2 (요금제 변경에 따른 환불정책)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {"상위 요금제로 변경 시 기존 요금제의 잔여기간 및 잔여 질문권은 즉시 소멸되며 환불되지 않습니다."}
                </li>
                <li>
                  {
                    "하위 요금제로 변경 요청 시 변경은 다음 결제일부터 적용되며 그 이전에 결제된 요금은 환불되지 않습니다."
                  }
                </li>
                <li>{"변경 신청 후 서비스 이용을 중단하더라도 이미 결제된 요금은 환불되지 않습니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-3" className="space-y-3">
              <h2 id="article-3" className="text-xl font-semibold">
                {"제3조 (보너스 질문권 환불 불가)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{"보너스 질문권은 환불 대상이 아니며, 유효기간 내 미사용 시 자동 소멸됩니다."}</li>
                <li>
                  {
                    "질문권과 보너스 질문권을 모두 보유한 경우, 유효기간이 먼저 도래하는 보너스 질문권이 우선 차감됩니다."
                  }
                </li>
                <li>{"부정 취득된 보너스 질문권은 회수되며, 양도·매매는 불가합니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-4" className="space-y-3">
              <h2 id="article-4" className="text-xl font-semibold">
                {"제4조 (자동결제 및 해지)"}
              </h2>
              <p>
                {
                  "구독 서비스는 결제일을 기준으로 매월/매년 자동 갱신됩니다. 이용자가 갱신을 원하지 않는 경우, 차기 결제일 이전에 반드시 해지 신청을 해야 하며, 결제 완료 후에는 환불되지 않습니다."
                }
              </p>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-5" className="space-y-3">
              <h2 id="article-5" className="text-xl font-semibold">
                {"제5조 (과오금)"}
              </h2>
              <p>
                {
                  "과오금 발생 시 결제와 동일한 방법으로 환불하며, 동일 방법 불가 시 사전 안내 후 다른 방법으로 환불합니다."
                }
              </p>
            </section>

            <Separator className="my-6" />

            <p className="text-sm text-neutral-500">
              {"본 정책은 관련 법령의 개정 또는 서비스 정책 변경에 따라 사전 고지 후 변경될 수 있습니다."}
            </p>

            <div className="pt-4 border-t">
              <p className="text-sm text-neutral-500">
                <strong>공고일자:</strong> 2025년 8월 22일
                <br />
                <strong>시행일자:</strong> 2025년 8월 22일
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/charge"
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            aria-label="충전 페이지로 이동"
          >
            {"충전(결제) 페이지로 이동"}
          </Link>
        </div>
      </div>
    </main>
  )
}
