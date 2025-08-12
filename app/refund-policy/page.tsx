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
            <CardTitle className="text-2xl md:text-3xl font-bold">
              {"환불 및 유효기간 규정"}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            <p className="text-neutral-600">
              {"사주핑 핑(포인트) 환불 및 유효기간에 대한 기준을 안내드립니다."}
            </p>

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
                <li>
                  {
                    "전액 환불 시, 결제 대행 수수료 등 환불 처리에 소요되는 실비가 공제될 수 있습니다."
                  }
                </li>
                <li>
                  {"환불은 결제 시 사용한 동일한 결제 수단으로만 진행됩니다."}
                </li>
              </ul>
            </section>

            <Separator className="my-6" />

            <section aria-labelledby="article-2" className="space-y-3">
              <h2 id="article-2" className="text-xl font-semibold">
                {"제2조 (부분 사용 후 환불 불가 및 유효기간)"}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {
                    "구매한 핑(포인트)을 1회 이상 사용한 경우, 잔여 핑에 대해서는 환불이 불가합니다."
                  }
                </li>
                <li>
                  {
                    "구매한 핑(포인트)의 이용기간과 환불 가능 기간은 ���제일로부터 1년입니다."
                  }
                </li>
                <li>
                  {
                    "유효기간이 경과하면 잔여 핑은 자동 소멸되며, 소멸된 핑은 환불되지 않습니다."
                  }
                </li>
                <li>
                  {
                    "서비스 이용 중 이용자의 귀책사유로 계정이 정지·탈퇴된 경우 잔여 핑은 환불되지 않습니다."
                  }
                </li>
              </ul>
            </section>

            <Separator className="my-6" />

            <p className="text-sm text-neutral-500">
              {
                "본 정책은 관련 법령의 개정 또는 서비스 정책 변경에 따라 사전 고지 후 변경될 수 있습니다."
              }
            </p>
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
