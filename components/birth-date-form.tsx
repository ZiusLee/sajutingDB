"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BirthDateForm() {
  const router = useRouter()
  const [year, setYear] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [day, setDay] = useState<string>("")
  const [time, setTime] = useState<string>("12:00")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 현재 연도부터 1900년까지의 연도 배열 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => (currentYear - i).toString())

  // 월 배열 생성 (01-12)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  // 일 배열 생성 (01-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!year || !month || !day) return

    setIsSubmitting(true)

    const formattedDate = `${year}${month}${day}`
    const [hours, minutes] = time.split(":").map(Number)

    router.push(`/result?date=${formattedDate}&hour=${hours}&minute=${minutes}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>생년월일</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="연도" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue placeholder="월" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {Number.parseInt(m)}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={day} onValueChange={setDay}>
            <SelectTrigger>
              <SelectValue placeholder="일" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>
                  {Number.parseInt(d)}일
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthtime">태어난 시간</Label>
        <Input id="birthtime" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full" />
      </div>

      <Button type="submit" className="w-full" disabled={!year || !month || !day || isSubmitting}>
        {isSubmitting ? "계산 중..." : "사주팔자 보기"}
      </Button>
    </form>
  )
}
