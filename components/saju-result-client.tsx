"use client"

import type { Saju } from "@/lib/saju"
import ReactMarkdown from "react-markdown"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import SajuDiagram from "./saju-diagram"

interface SajuResultClientProps {
  saju: Saju
  timeUnknown?: boolean
  solarYear?: string
  solarMonth?: string
  solarDay?: string
  hour?: string
  minute?: string
  lunarYear?: string
  lunarMonth?: string
  lunarDay?: string
}

export default function SajuResultClient({
  saju,
  timeUnknown = false,
  solarYear,
  solarMonth,
  solarDay,
  hour,
  minute,
  lunarYear,
  lunarMonth,
  lunarDay,
}: SajuResultClientProps) {
  const interpretation = saju?.interpretation || ""

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <SajuDiagram saju={saju} timeUnknown={timeUnknown} size="lg" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">사주 해석</h3>
            <ReactMarkdown>{interpretation}</ReactMarkdown>
          </div>
          <Separator className="my-3" />
        </CardContent>
      </Card>
    </div>
  )
}
