import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getLunarDate } from "@/lib/api"
import { calculateSaju } from "@/lib/saju"
import DaeunDiagram from "@/components/daeun-diagram"
import { Separator } from "@/components/ui/separator"
import { getSajuDataByUuid } from "@/lib/saju-session-service"

export default async function DaeunAnalysisPage({
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
            <CardDescription className="text-center">대운 분석을 보려면 필요한 정보를 입력해주세요.</CardDescription>
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
              <CardTitle className="text-center text-2xl">10년 대운 상세분석</CardTitle>
              <CardDescription className="text-center">
                {userData.name && <>이름: {userData.name}님</>}
                {userData.name && userData.gender && <br />}
                {userData.gender && <>{userData.gender === "male" ? "남성" : "여성"}</>}
                <br />
                양력: {formattedSaju.year}년 {formattedSaju.month}월 {formattedSaju.day}일
                {formattedSaju.hour && ` ${formattedSaju.hour}시 ${formattedSaju.minute || "00"}분`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 대운 다이어그램 표시 */}
              <DaeunDiagram
                saju={formattedSaju}
                timeUnknown={false}
                solarYear={formattedSaju.year}
                solarMonth={formattedSaju.month}
                solarDay={formattedSaju.day}
                hour={formattedSaju.hour || ""}
                minute={formattedSaju.minute || ""}
                gender={userData.gender}
              />

              {/* 대운 상세 해석 */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">대운 상세 해석</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    대운(大運)은 10년 단위로 변화하는 큰 운의 흐름으로, 인생의 주요 시기별 특성을 보여줍니다. 각 대운은
                    천간(天干)과 지지(地支)의 조합으로 이루어지며, 이는 해당 시기의 기회와 도전을 나타냅니다.
                  </p>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-base mb-2">현재 대운의 의미</h3>
                      <p className="text-sm">
                        현재 대운은 당신의 현재 삶에 가장 큰 영향을 미치는 에너지입니다. 이 시기에는 대운의 특성에 맞는
                        활동과 결정이 더 좋은 결과를 가져올 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-base mb-2">대운과 일주의 관계</h3>
                      <p className="text-sm">
                        대운은 일주(日柱)와의 관계에서 그 영향력이 결정됩니다. 일주와 상생(相生) 관계에 있는 대운은
                        도움이 되는 시기를, 상극(相剋) 관계에 있는 대운은 도전적인 시기를 의미할 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-base mb-2">대운 활용 방법</h3>
                      <p className="text-sm">
                        각 대운의 특성을 이해하고 그에 맞는 활동에 집중하면 더 나은 결과를 얻을 수 있습니다. 예를 들어,
                        목(木) 기운이 강한 대운에서는 창의적인 활동이나 성장과 관련된 일이 유리합니다.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 결과 페이지로 돌아가기 버튼 */}
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link href={`/result?uuid=${uuid}`}>결과 페이지로 돌아가기</Link>
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

      return (
        <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
          <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl">10년 대운 상세분석</CardTitle>
              <CardDescription className="text-center">
                {name && <>이름: {name}님</>}
                {name && gender && <br />}
                {gender && <>{gender === "male" ? "남성" : "여성"}</>}
                <br />
                양력: {sajuData.year}년 {sajuData.month}월 {sajuData.day}일
                {!sajuData.timeUnknown && sajuData.hour && ` ${sajuData.hour}시 ${sajuData.minute || "00"}분`}
                {sajuData.timeUnknown && " (시간 미상)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 대운 다이어그램 표시 */}
              <DaeunDiagram
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
                gender={gender}
              />

              {/* 대운 상세 해석 */}
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">대운 상세 해석</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    대운(大運)은 10년 단위로 변화하는 큰 운의 흐름으로, 인생의 주요 시기별 특성을 보여줍니다. 각 대운은
                    천간(天干)과 지지(地支)의 조합으로 이루어지며, 이는 해당 시기의 기회와 도전을 나타냅니다.
                  </p>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-base mb-2">현재 대운의 의미</h3>
                      <p className="text-sm">
                        현재 대운은 당신의 현재 삶에 가장 큰 영향을 미치는 에너지입니다. 이 시기에는 대운의 특성에 맞는
                        활동과 결정이 더 좋은 결과를 가져올 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-base mb-2">대운과 일주의 관계</h3>
                      <p className="text-sm">
                        대운은 일주(日柱)와의 관계에서 그 영향력이 결정됩니다. 일주와 상생(相生) 관계에 있는 대운은
                        도움이 되는 시기를, 상극(相剋) 관계에 있는 대운은 도전적인 시기를 의미할 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-base mb-2">대운 활용 방법</h3>
                      <p className="text-sm">
                        각 대운의 특성을 이해하고 그에 맞는 활동에 집중하면 더 나은 결과를 얻을 수 있습니다. 예를 들어,
                        목(木) 기운이 강한 대운에서는 창의적인 활동이나 성장과 관련된 일이 유리합니다.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 결과 페이지로 돌아가기 버튼 */}
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link
                    href={`/result?saju=${encodeURIComponent(sajuParam)}&name=${name || ""}&gender=${gender || ""}&location=${location || ""}`}
                  >
                    결과 페이지로 돌아가기
                  </Link>
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
            <CardDescription className="text-center">대운 분석을 보려면 날짜와 시간 정보가 필요합니다.</CardDescription>
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
      gender,
      name,
      isTimeUnknown,
      lunarData.isLeapMonth,
    )

    return (
      <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
        <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">10년 대운 상세분석</CardTitle>
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
            {/* 대운 다이어그램 표시 */}
            <DaeunDiagram
              saju={saju}
              timeUnknown={isTimeUnknown}
              solarYear={solarYear}
              solarMonth={solarMonth}
              solarDay={solarDay}
              hour={hour || ""}
              minute={minute || ""}
              gender={gender}
            />

            {/* 대운 상세 해석 */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">대운 상세 해석</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  대운(大運)은 10년 단위로 변화하는 큰 운의 흐름으로, 인생의 주요 시기별 특성을 보여줍니다. 각 대운은
                  천간(天干)과 지지(地支)의 조합으로 이루어지며, 이는 해당 시기의 기회와 도전을 나타냅니다.
                </p>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-base mb-2">현재 대운의 의미</h3>
                    <p className="text-sm">
                      현재 대운은 당신의 현재 삶에 가장 큰 영향을 미치는 에너지입니다. 이 시기에는 대운의 특성에 맞는
                      활동과 결정이 더 좋은 결과를 가져올 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-base mb-2">대운과 일주의 관계</h3>
                    <p className="text-sm">
                      대운은 일주(日柱)와의 관계에서 그 영향력이 결정됩니다. 일주와 상생(相生) 관계에 있는 대운은 도움이
                      되는 시기를, 상극(相剋) 관계에 있는 대운은 도전적인 시기를 의미할 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-base mb-2">대운 활용 방법</h3>
                    <p className="text-sm">
                      각 대운의 특성을 이해하고 그에 맞는 활동에 집중하면 더 나은 결과를 얻을 수 있습니다. 예를 들어,
                      목(木) 기운이 강한 대운에서는 창의적인 활동이나 성장과 관련된 일이 유리합니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 결과 페이지로 돌아가기 버튼 */}
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link
                  href={`/result?date=${date}&hour=${hour}&minute=${minute}&timeUnknown=${timeUnknown}&name=${name || ""}&gender=${gender || ""}&location=${location || ""}`}
                >
                  결과 ��이지로 돌아가기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error in daeun analysis page:", error)
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">오류 발생</CardTitle>
            <CardDescription className="text-center">대운 분석을 계산하는 중 오류가 발생했습니다.</CardDescription>
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
