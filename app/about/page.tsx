"use client"

import { useEffect } from "react"
import { AboutSajuping } from "@/components/about-sajuping"
import { trackIntegratedEvents } from "@/lib/analytics"

export default function AboutPage() {
  useEffect(() => {
    trackIntegratedEvents.pageView("about")
  }, [])

  return (
    <div className="min-h-screen py-12">
      <AboutSajuping />
    </div>
  )
}
