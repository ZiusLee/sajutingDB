import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import SocialShareButtons from "@/components/social-share-buttons"
import { BetaSignupForm } from "@/components/beta-signup-form"
import SajuResult from "@/components/saju-result"

interface ResultPageProps {
  searchParams: {
    saju?: string
    name?: string
    gender?: string
    location?: string
  }
}

const ResultPage = async ({ searchParams }: ResultPageProps) => {
  const { saju: sajuParam, name, gender, location } = searchParams

  // 사주 파라미터가 있는 경우 (마이페이지에서 직접 전달된 경우)
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
                    daeunAge: sajuData.daeunAge, // 대운세수 전달
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
                  sajuId={sajuData.profileId} // 프로필 ID 전달
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
      return (
        <div className="container mx-auto py-6 text-center">
          <Card className="w-full mx-auto max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">데이터 로드 오류</h2>
              <p className="mb-4">사주 데이터를 불러오는 중 오류가 발생했습니다.</p>
              <Button asChild>
                <Link href="/mypage">마이페이지로 돌아가기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // 사주 파라미터가 없는 경우
  return (
    <div className="container mx-auto py-6 text-center">
      <Card className="w-full mx-auto max-w-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">사주 정보 없음</h2>
          <p className="mb-4">사주 정보가 전달되지 않았습니다.</p>
          <Button asChild>
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResultPage
