"use client"

import { InfoIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface ProfileInfoProps {
  name: string
  dayMasterInfo: {
    colorName: string
    animalName: string
    elementName: string
    ilju: string
  }
  birthInfo?: {
    birthYear?: string | number
    birthMonth?: string | number
    birthDay?: string | number
    birthHour?: string | number
    birthMinute?: string | number
    timeUnknown?: boolean
    location?: string
    gender?: string
  }
  variant?: "chat" | "sidebar" | "card"
}

export default function ProfileInfo({ name, dayMasterInfo, birthInfo, variant = "chat" }: ProfileInfoProps) {
  const displayName = name || "사용자"

  if (variant === "sidebar") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {displayName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{displayName}의 사주 ⭐</h3>
            <p className="text-xs text-red-500">
              {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName}) {dayMasterInfo.colorName}
              {dayMasterInfo.animalName}
            </p>
          </div>
        </div>

        {/* Birth Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-start gap-2">
            <span>생일</span>
            <span>
              {birthInfo?.birthYear || ""}. {birthInfo?.birthMonth || ""}. {birthInfo?.birthDay || ""}(양력)
            </span>
          </div>
          <div className="flex justify-start gap-2">
            <span>생시</span>
            <span>
              {birthInfo?.timeUnknown
                ? "시간 모름"
                : `${String(birthInfo?.birthHour || "00").padStart(2, "0")}시 ${String(birthInfo?.birthMinute || "00").padStart(2, "0")}분`}
              , {birthInfo?.location || "서울특별시"}
            </span>
          </div>
          <div className="flex justify-start gap-2">
            <span>성별</span>
            <span>{birthInfo?.gender === "male" ? "남성" : birthInfo?.gender === "female" ? "여성" : "미상"}</span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-foreground">
          {displayName}님의 사주: {dayMasterInfo.ilju}일주
        </h3>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Profile section */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg shadow-sm">
        <div className="w-16 h-16 rounded-xl bg-red-400 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
          {displayName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{displayName}의 사주</h2>
            <span className="text-muted-foreground">⭐</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">사주란?</p>
                  <p>사주는 태어난 년, 월, 일, 시의 천간과 지지를 나타내는 8개의 글자로 구성됩니다.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {dayMasterInfo.ilju && (
            <p className="text-red-500 font-medium">
              {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName}) {dayMasterInfo.colorName}
              {dayMasterInfo.animalName}
            </p>
          )}
        </div>
      </div>

      {/* Birth info */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">생일</span>
          <span>
            {birthInfo?.birthYear || ""}. {birthInfo?.birthMonth || ""}. {birthInfo?.birthDay || ""}
            (양력)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">생시</span>
          <span>
            {birthInfo?.timeUnknown
              ? "시간 모름"
              : `${String(birthInfo?.birthHour || "00").padStart(2, "0")}시 ${String(birthInfo?.birthMinute || "00").padStart(2, "0")}분`}
            , {birthInfo?.location || "서울특별시"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">성별</span>
          <span>{birthInfo?.gender === "male" ? "남성" : birthInfo?.gender === "female" ? "여성" : "미상"}</span>
        </div>
      </div>
    </div>
  )
}
