import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLunarDate } from "@/lib/api"
import { calculateSaju } from "@/lib/saju"
import SajuResult from "@/components/saju-result"
import SocialShareButtons from "@/components/social-share-buttons"
import { notFound } from "next/navigation"
import { BetaSignupForm } from "@/components/beta-signup-form"

export default async function ResultPage({
  searchParams,
}: {
  searchParams: {
    date?: string
    hour?: string
    minute?: string
    timeUnknown?: string
    name?: string
    gender?: string
    saju?: string
    location?: string
  }
}) {
  const { date, hour, minute, timeUnknown, name, gender, saju: sajuParam, location = "서울특별시" } = searchParams

  // 사주 파라미터가 있는 경우 (채팅 목록에서 돌아온 경우)
  if (sajuParam) {
    try {
      const sajuData = JSON.parse(decodeURIComponent(sajuParam))

      return (
        <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
          <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl">사주팔자 결과</CardTitle>
              <CardDescription className="text-center">
                {name && <>이름: {name}님</>}
                {name && gender && <br />}
                {gender && <>{gender === "male" ? "남성" : "여성"}</>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 사주 결과 표시 */}
              <div className="space-y-6">
                <SajuResult
                  saju={sajuData}
                  timeUnknown={false}
                  solarYear={sajuData.year}
                  solarMonth={sajuData.month}
                  solarDay={sajuData.day}
                  hour={sajuData.hour || ""}
                  minute={sajuData.minute || ""}
                  lunarYear={sajuData.lunarYear}
                  lunarMonth={sajuData.lunarMonth}
                  lunarDay={sajuData.lunarDay}
                  name={name}
                  gender={gender}
                  location={location}
                />

                {/* 소셜미디어 공유 버튼 추가 */}
                <div className="py-2">
                  <SocialShareButtons />
                </div>
              </div>

              {/* 베타서비스 신청 폼 */}
              <div className="mb-6">
                <BetaSignupForm />
              </div>
            </CardContent>
          </Card>
        </div>
      )
    } catch (error) {
      console.error("Error parsing saju data:", error)
      // 파싱 오류 시 아래 기본 로직으로 진행
    }
  }

  // 기존 로직 (직접 날짜 파라미터로 접근한 경우)
  if (!date || !hour || !minute) {
    notFound()
  }

  const solarYear = date.substring(0, 4)
  const solarMonth = date.substring(4, 6)
  const solarDay = date.substring(6, 8)

  try {
    // Get lunar date from API
    const lunarData = await getLunarDate(solarYear, solarMonth, solarDay)

    if (!lunarData) {
      throw new Error("Failed to get lunar date")
    }

    // Convert timeUnknown string to boolean
    const isTimeUnknown = timeUnknown === "true"

    const hourNumber = Number.parseInt(hour || "0")
    const minuteNumber = Number.parseInt(minute || "0")

    // Calculate Saju based on lunar date
    const saju = calculateSaju(
      lunarData.year,
      lunarData.month,
      lunarData.day,
      hourNumber,
      minuteNumber,
      Number.parseInt(solarYear),
      Number.parseInt(solarMonth),
      Number.parseInt(solarDay),
      gender, // Pass gender correctly
      name, // Pass name correctly
      isTimeUnknown,
      lunarData.isLeapMonth, // 윤달 정보 전달
    )

    return (
      <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
        <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">사주팔자 결과</CardTitle>
            <CardDescription className="text-center">
              양력: {solarYear}년 {solarMonth}월 {solarDay}일 {isTimeUnknown ? "(시간 미상)" : `${hour}시 ${minute}분`}
              <br />
              음력: {lunarData.year}년 {lunarData.month}월 {lunarData.day}일{name && <br />}
              {name && <>이름: {name}님</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 사주 결과 표시 */}
            <div className="space-y-6">
              <SajuResult
                saju={saju}
                timeUnknown={isTimeUnknown}
                solarYear={solarYear}
                solarMonth={solarMonth}
                solarDay={solarDay}
                hour={hour || ""}
                minute={minute || ""}
                lunarYear={lunarData.year}
                lunarMonth={lunarData.month}
                lunarDay={lunarData.day}
                name={name}
                gender={gender}
                location={location}
              />

              {/* 소셜미디어 공유 버튼 추가 */}
              <div className="py-2">
                <SocialShareButtons />
              </div>
            </div>

            {/* 베타서비스 신청 폼 */}
            <div className="mb-6">
              <BetaSignupForm />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error in result page:", error)
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">오류 발생</CardTitle>
            <CardDescription className="text-center">사주팔자를 계산하는 중 오류가 발생했습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center">{error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}</p>

            <div className="flex justify-center">
              <Button asChild>
                <Link href="/">돌아가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
