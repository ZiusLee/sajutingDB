"use client"

import { useEffect } from "react"
import Link from "next/link"
import ChargeStation from "@/components/charge-station"
import { trackIntegratedEvents } from "@/lib/analytics"

export const dynamic = "force-dynamic"

export default function ChargePage() {
  useEffect(() => {
    trackIntegratedEvents.pageView("charge")
  }, [])

  return (
    <main className="h-screen bg-[#1b1c1e] text-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md md:max-w-lg">
          <ChargeStation />

          <div className="mt-6 text-center px-4 pb-8">
            <Link
              href="/refund-policy"
              className="text-sm text-[#aeb0b6] hover:text-white underline underline-offset-4"
              aria-label="환불 및 유효기간 규정 보기"
            >
              환불 및 유효기간 규정 보기
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
