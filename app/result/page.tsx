import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLunarDate } from "@/lib/api"
import { calculateSaju } from "@/lib/saju"
import SajuResult from "@/components/saju-result"
import SocialShareButtons from "@/components/social-share-buttons"
import { BetaSignupForm } from "@/components/beta-signup-form"
import { getSajuDataByUuid } from "@/lib/saju-session-service"

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
    uuid?: string
  }
}) {
  const { date, hour, minute, timeUnknown, name, gender, saju: sajuParam, location = "서울특별시", uuid } = searchParams

  // If no parameters are provided, show a message and link to home
  if (!date && !uuid && !sajuParam) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">사주 정보 필요</CardTitle>
            <CardDescription className="text-center">사주 결과를 보려면 필요한 정보를 입력해주세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center">사주 정보가 없습니다. 홈페이지로 이동하여 사주 정보를 입력해주세요.</p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/">홈으로 이동</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // UUID로 사주 데이터 조회 (마이페이지에서 상세 보기로 접근한 경우)
  if (uuid) {
    try {
      const sajuData = await getSajuDataByUuid(uuid)

      if (!sajuData) {
        throw new Error("사주 데이터를 찾을 수 없습니다.")
      }

      const { userData, sajuData: formattedSaju } = sajuData

      return (
        <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
          <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl">사주팔자 결과</CardTitle>
              <CardDescription className="text-center">
                {userData.name && <>이름: {userData.name}님</>}
                {userData.name && userData.gender && <br />}
                {userData.gender && <>{userData.gender === "male" ? "남성" : "여성"}</>}
                <br />
                양력: {formattedSaju.year}년 {formattedSaju.month}월 {formattedSaju.day}일
                {formattedSaju.hour && ` ${formattedSaju.hour}시 ${formattedSaju.minute || "00"}분`}
                <br />
                음력: {formattedSaju.lunarYear}년 {formattedSaju.lunarMonth}월 {formattedSaju.lunarDay}일
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 사주 결과 표시 */}
              <div className="space-y-6">
                <SajuResult
                  saju={formattedSaju}
                  timeUnknown={false}
                  solarYear={formattedSaju.year}
                  solarMonth={formattedSaju.month}
                  solarDay={formattedSaju.day}
                  hour={formattedSaju.hour || ""}
                  minute={formattedSaju.minute || ""}
                  lunarYear={formattedSaju.lunarYear}
                  lunarMonth={formattedSaju.lunarMonth}
                  lunarDay={formattedSaju.lunarDay}
                  name={userData.name}
                  gender={userData.gender}
                  location={location}
                  interpretation={formattedSaju.interpretation}
                />

                {/* 소셜미디어 공유 버튼 추가 */}
                <div className="py-2">
                  <SocialShareButtons />
                </div>

                {/* 채팅 상담 버튼 추가 */}
                <div className="py-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      href={`/chat-list?saju=${
                        sajuParam || encodeURIComponent(JSON.stringify(formattedSaju))
                      }&name=${encodeURIComponent(userData.name || "")}&gender=${encodeURIComponent(userData.gender || "")}&returnPath=/result?${
                        uuid
                          ? `uuid=${uuid}`
                          : `saju=${sajuParam || encodeURIComponent(JSON.stringify(formattedSaju))}&name=${encodeURIComponent(userData.name || "")}&gender=${encodeURIComponent(userData.gender || "")}`
                      }`}
                    >
                      AI 상담 시작하기
                    </Link>
                  </Button>
                </div>
              </div>

              {/* 베타서비스 신청 폼 */}
              <div className="mb-6">
                <BetaSignupForm />
              </div>

              {/* 마이페이지로 돌아가기 버튼 */}
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link href="/mypage">마이페이지로 돌아가기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    } catch (error) {
      console.error("Error fetching saju data by UUID:", error)
      // 오류 시 아래 기본 로직으로 진행
    }
  }

  // 사주 파라미터가 있는 경우 (채팅 목록에서 돌아온 경우 또는 마이페이지에서 직접 전달된 경우)
  if (sajuParam) {
    try {
      const sajuData = JSON.parse(decodeURIComponent(sajuParam))

      // 디버깅을 위해 콘솔에 출력
      console.log("Received saju data:", sajuData)

      return (
        <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
          <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl">사주팔자 결과</CardTitle>
              <CardDescription className="text-center">
                {name && <>이름: {name}님</>}
                {name && gender && <br />}
                {gender && <>{gender === "male" ? "남성" : "여성"}</>}
                <br />
                양력: {sajuData.year}년 {sajuData.month}월 {sajuData.day}일
                {!sajuData.timeUnknown && sajuData.hour && ` ${sajuData.hour}시 ${sajuData.minute || "00"}분`}
                {sajuData.timeUnknown && " (시간 미상)"}
                <br />
                음력: {sajuData.lunarYear}년 {sajuData.lunarMonth}월 {sajuData.lunarDay}일
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 사주 결과 표시 */}
              <div className="space-y-6">
                <SajuResult
                  saju={{
                    yearStem: sajuData.yearStem,
                    yearBranch: sajuData.yearBranch,
                    monthStem: sajuData.monthStem,
                    monthBranch: sajuData.monthBranch,
                    dayStem: sajuData.dayStem,
                    dayBranch: sajuData.dayBranch,
                    hourStem: sajuData.hourStem,
                    hourBranch: sajuData.hourBranch,
                    yearStemSibseong: sajuData.yearStemSibseong,
                    monthStemSibseong: sajuData.monthStemSibseong,
                    dayStemSibseong: sajuData.dayStemSibseong,
                    hourStemSibseong: sajuData.hourStemSibseong,
                    yearBranchSibseong: sajuData.yearBranchSibseong,
                    monthBranchSibseong: sajuData.monthBranchSibseong,
                    dayBranchSibseong: sajuData.dayBranchSibseong,
                    hourBranchSibseong: sajuData.hourBranchSibseong,
                    yearStemHanja: sajuData.yearStemHanja,
                    yearBranchHanja: sajuData.yearBranchHanja,
                    monthStemHanja: sajuData.monthStemHanja,
                    monthBranchHanja: sajuData.monthBranchHanja,
                    dayStemHanja: sajuData.dayStemHanja,
                    dayBranchHanja: sajuData.dayBranchHanja,
                    hourStemHanja: sajuData.hourStemHanja,
                    hourBranchHanja: sajuData.hourBranchHanja,
                    elements: sajuData.elements,
                    dayMaster: sajuData.dayMaster,
                    dayMasterHanja: sajuData.dayMasterHanja,
                    year: sajuData.year,
                    month: sajuData.month,
                    day: sajuData.day,
                    hour: sajuData.hour,
                    minute: sajuData.minute,
                    lunarYear: sajuData.lunarYear,
                    lunarMonth: sajuData.lunarMonth,
                    lunarDay: sajuData.lunarDay,
                  }}
                  timeUnknown={sajuData.timeUnknown || false}
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

                {/* 채팅 상담 버튼 추가 */}
                <div className="py-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      href={`/chat-list?saju=${
                        sajuParam ||
                        encodeURIComponent(
                          JSON.stringify({
                            yearStem: sajuData.yearStem,
                            yearBranch: sajuData.yearBranch,
                            monthStem: sajuData.monthStem,
                            monthBranch: sajuData.monthBranch,
                            dayStem: sajuData.dayStem,
                            dayBranch: sajuData.dayBranch,
                            hourStem: sajuData.hourStem,
                            hourBranch: sajuData.hourBranch,
                            yearStemSibseong: sajuData.yearStemSibseong,
                            monthStemSibseong: sajuData.monthStemSibseong,
                            dayStemSibseong: sajuData.dayStemSibseong,
                            hourStemSibseong: sajuData.hourStemSibseong,
                            yearBranchSibseong: sajuData.yearBranchSibseong,
                            monthBranchSibseong: sajuData.monthBranchSibseong,
                            dayBranchSibseong: sajuData.dayBranchSibseong,
                            hourBranchSibseong: sajuData.hourBranchSibseong,
                            yearStemHanja: sajuData.yearStemHanja,
                            yearBranchHanja: sajuData.yearBranchHanja,
                            monthStemHanja: sajuData.monthStemHanja,
                            monthBranchHanja: sajuData.monthBranchHanja,
                            dayStemHanja: sajuData.dayStemHanja,
                            dayBranchHanja: sajuData.dayBranchHanja,
                            hourStemHanja: sajuData.hourStemHanja,
                            hourBranchHanja: sajuData.hourBranchHanja,
                            elements: sajuData.elements,
                            dayMaster: sajuData.dayMaster,
                            dayMasterHanja: sajuData.dayMasterHanja,
                            year: sajuData.year,
                            month: sajuData.month,
                            day: sajuData.day,
                            hour: sajuData.hour,
                            minute: sajuData.minute,
                            lunarYear: sajuData.lunarYear,
                            lunarMonth: sajuData.lunarMonth,
                            lunarDay: sajuData.lunarDay,
                          }),
                        )
                      }&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(gender || "")}&returnPath=/result?${
                        uuid
                          ? `uuid=${uuid}`
                          : `saju=${
                              sajuParam ||
                              encodeURIComponent(
                                JSON.stringify({
                                  yearStem: sajuData.yearStem,
                                  yearBranch: sajuData.yearBranch,
                                  monthStem: sajuData.monthStem,
                                  monthBranch: sajuData.monthBranch,
                                  dayStem: sajuData.dayStem,
                                  dayBranch: sajuData.dayBranch,
                                  hourStem: sajuData.hourStem,
                                  hourBranch: sajuData.hourBranch,
                                  yearStemSibseong: sajuData.yearStemSibseong,
                                  monthStemSibseong: sajuData.monthStemSibseong,
                                  dayStemSibseong: sajuData.dayStemSibseong,
                                  hourStemSibseong: sajuData.hourStemSibseong,
                                  yearBranchSibseong: sajuData.yearBranchSibseong,
                                  monthBranchSibseong: sajuData.monthBranchSibseong,
                                  dayBranchSibseong: sajuData.dayBranchSibseong,
                                  hourBranchSibseong: sajuData.hourBranchSibseong,
                                  yearStemHanja: sajuData.yearStemHanja,
                                  yearBranchHanja: sajuData.yearBranchHanja,
                                  monthStemHanja: sajuData.monthStemHanja,
                                  monthBranchHanja: sajuData.monthBranchHanja,
                                  dayStemHanja: sajuData.dayStemHanja,
                                  dayBranchHanja: sajuData.dayBranchHanja,
                                  hourStemHanja: sajuData.hourStemHanja,
                                  hourBranchHanja: sajuData.hourBranchHanja,
                                  elements: sajuData.elements,
                                  dayMaster: sajuData.dayMaster,
                                  dayMasterHanja: sajuData.dayMasterHanja,
                                  year: sajuData.year,
                                  month: sajuData.month,
                                  day: sajuData.day,
                                  hour: sajuData.hour,
                                  minute: sajuData.minute,
                                  lunarYear: sajuData.lunarYear,
                                  lunarMonth: sajuData.lunarMonth,
                                  lunarDay: sajuData.lunarDay,
                                }),
                              )
                            }&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(gender || "")}`
                      }`}
                    >
                      AI 상담 시작하기
                    </Link>
                  </Button>
                </div>
              </div>

              {/* 베타서비스 신청 폼 */}
              <div className="mb-6">
                <BetaSignupForm />
              </div>

              {/* 마이페이지로 돌아가기 버튼 */}
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link href="/mypage">마이페이지로 돌아가기</Link>
                </Button>
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
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">필수 정보 누락</CardTitle>
            <CardDescription className="text-center">사주 결과를 보려면 날짜와 시간 정보가 필요합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center">날짜, 시간 정보가 누락되었습니다. 홈페이지로 이동하여 정보를 입력해주세요.</p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/">홈으로 이동</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
              음력: {lunarData.year}년 {lunarData.month}월 {lunarData.day}일
              {name && (
                <>
                  <br />
                  이름: {name}님
                </>
              )}
              {gender && (
                <>
                  <br />
                  {gender === "male" ? "남성" : "여성"}
                </>
              )}
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

              {/* 채팅 상담 버튼 추가 */}
              <div className="py-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link
                    href={`/chat-list?saju=${
                      sajuParam || encodeURIComponent(JSON.stringify(saju))
                    }&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(gender || "")}&returnPath=/result?${
                      uuid
                        ? `uuid=${uuid}`
                        : `saju=${sajuParam || encodeURIComponent(JSON.stringify(saju))}&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(gender || "")}`
                    }`}
                  >
                    AI 상담 시작하기
                  </Link>
                </Button>
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
