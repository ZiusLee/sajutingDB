import Link from "next/link"
import ChargeStation from "@/components/charge-station"

export const dynamic = "force-dynamic"

export default async function ChargePage() {
  return (
    <main className="min-h-[100dvh] bg-[#1b1c1e] text-white">
      <div className="mx-auto w-full max-w-md md:max-w-lg px-4 md:px-6 py-4 md:py-8">
        <ChargeStation />

        <div className="mt-6 text-center">
          <Link
            href="/refund-policy"
            className="text-sm text-[#aeb0b6] hover:text-white underline underline-offset-4"
            aria-label="환불 및 유효기간 규정 보기"
          >
            환불 및 유효기간 규정 보기
          </Link>
        </div>
      </div>
    </main>
  )
}
