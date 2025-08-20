import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "환불 및 유효기간 규정 - 사주핑",
  description: "사주핑 핑(포인트) 환불 및 유효기간 정책 안내",
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
            <p className="text-neutral-600">{"사주핑 핑(포인트) 환불 및 유효기간에 대한 기준을 안내드립니다."}</p>

            <Separator className="my-6" />

            <section aria-labelledby="definitions" className="space-y-3">
              <h2 id="definitions" className="text-xl font-semibold">
                {"정의"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>핑:</strong> 회원이 유료서비스 또는 콘텐츠 구매 시 사용할 수 있도록 유상으로 충전하는
                  사이버머니입니다. 핑은 마지막 이용일로부터 5년 동안 사용하지 않을 경우 「상사소멸시효」에 따라 소멸될
                  수 있습니다.
                </li>
                <li>
                  <strong>보너스핑:</strong> 회사가 이벤트, 프로모션 등으로 무상 지급하는 가상의 데이터입니다.
                  보너스핑은 환불되지 않으며, 유효기간은 회사 정책에 따릅니다. 유효기간 경과 시 자동 소멸되며, 소멸된
                  보너스핑은 환불 불가합니다.
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
                  {
                    "구매한 핑(포인트)은 1회도 사용하지 않은 경우에 한하여, 구매일로부터 7일 이내 전액 환불이 가능합니다."
                  }
                </li>
                <li>{"전액 환불 시, 결제 대행 수수료 등 환불 처리에 소요되는 실비가 공제될 수 있습니다."}</li>
                <li>{"환불은 결제 시 사용한 동일한 결제 수단으로만 진행됩니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-2" className="space-y-3">
              <h2 id="article-2" className="text-xl font-semibold">
                {"제2조 (부분 사용 후 환불 불가 및 유효기간)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{"구매한 핑(포인트)을 1회 이상 사용한 경우, 잔여 핑에 대해서는 환불이 불가합니다."}</li>
                <li>{"구매한 핑(포인트)의 이용기간과 환불 가능 기간은 결제일로부터 1년입니다."}</li>
                <li>{"유효기간이 경과하면 잔여 핑은 자동 소멸되며, 소멸된 핑은 환불되지 않습니다."}</li>
                <li>{"서비스 이용 중 이용자의 귀책사유로 계정이 정지·탈퇴된 경우 잔여 핑은 환불되지 않습니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-2-2" className="space-y-3">
              <h2 id="article-2-2" className="text-xl font-semibold">
                {"제2조의2 (요금제 변경에 따른 환불정책)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{"상위 요금제로 변경 시 기존 요금제의 잔여기간 및 잔여 핑은 즉시 소멸되며 환불되지 않습니다."}</li>
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
                {"제3조 (보너스핑 환불 불가)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{"보너스핑은 환불 대상이 아니며, 유효기간 내 미사용 시 자동 소멸됩니다."}</li>
                <li>{"핑과 보너스핑을 모두 보유한 경우, 유효기간이 먼저 도래하는 보너스핑이 우선 차감됩니다."}</li>
                <li>{"부정 취득된 보너스핑은 회수되며, 양도·매매는 불가합니다."}</li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-4" className="space-y-3">
              <h2 id="article-4" className="text-xl font-semibold">
                {"제4조 (과오금)"}
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
                <strong>공고일자:</strong> 2025년 8월 18일
                <br />
                <strong>시행일자:</strong> 2025년 8월 18일
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
