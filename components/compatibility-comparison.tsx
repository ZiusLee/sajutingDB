import { Card, CardContent } from "@/components/ui/card"
import type { Saju } from "@/lib/saju"

interface CompatibilityComparisonProps {
  userSaju: Saju
  partnerSaju: Saju
  userName?: string
  partnerName?: string
}

export default function CompatibilityComparison({
  userSaju,
  partnerSaju,
  userName = "나",
  partnerName = "상대방",
}: CompatibilityComparisonProps) {
  // 오행 색상 매핑
  const elementColors = {
    wood: "bg-green-100 border-green-500 text-green-800",
    fire: "bg-red-100 border-red-500 text-red-800",
    earth: "bg-yellow-100 border-yellow-500 text-yellow-800",
    metal: "bg-gray-100 border-gray-500 text-gray-800",
    water: "bg-blue-100 border-blue-500 text-blue-800",
  }

  // 간의 오행 매핑
  const stemElements = {
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water",
  }

  // 지의 오행 매핑
  const branchElements = {
    자: "water",
    축: "earth",
    인: "wood",
    묘: "wood",
    진: "earth",
    사: "fire",
    오: "fire",
    미: "earth",
    신: "metal",
    유: "metal",
    술: "earth",
    해: "water",
  }

  // 간의 오행 색상 가져오기
  const getStemColor = (stem: string) => {
    return elementColors[stemElements[stem as keyof typeof stemElements]]
  }

  // 지의 오행 색상 가져오기
  const getBranchColor = (branch: string) => {
    return elementColors[branchElements[branch as keyof typeof branchElements]]
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* 첫 번째 사람 사주 */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg text-center">{userName}의 사주</h3>

          {/* 사주 정보 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">년주</div>
                <div className="text-lg font-bold">
                  {userSaju.yearStem}
                  {userSaju.yearBranch}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">월주</div>
                <div className="text-lg font-bold">
                  {userSaju.monthStem}
                  {userSaju.monthBranch}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">일주</div>
                <div className="text-lg font-bold">
                  {userSaju.dayStem}
                  {userSaju.dayBranch}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">시주</div>
                <div className="text-lg font-bold">
                  {userSaju.hourStem}
                  {userSaju.hourBranch}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오행 분석 */}
          <div className="space-y-2">
            <h4 className="font-medium">오행 분석</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">목(木)</div>
                  <div className="text-lg font-bold">{userSaju.elements.wood}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">화(火)</div>
                  <div className="text-lg font-bold">{userSaju.elements.fire}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">토(土)</div>
                  <div className="text-lg font-bold">{userSaju.elements.earth}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">금(金)</div>
                  <div className="text-lg font-bold">{userSaju.elements.metal}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">수(水)</div>
                  <div className="text-lg font-bold">{userSaju.elements.water}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 사주 다이어그램 */}
          <div className="space-y-2">
            <h4 className="font-medium">사주 다이어그램</h4>
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">년주</div>
                <Card className={`border-2 ${getStemColor(userSaju.yearStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.yearStem}</div>
                    <div className="text-xs">{userSaju.yearStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(userSaju.yearBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.yearBranch}</div>
                    <div className="text-xs">{userSaju.yearBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">월주</div>
                <Card className={`border-2 ${getStemColor(userSaju.monthStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.monthStem}</div>
                    <div className="text-xs">{userSaju.monthStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(userSaju.monthBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.monthBranch}</div>
                    <div className="text-xs">{userSaju.monthBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">일주</div>
                <Card className={`border-2 ${getStemColor(userSaju.dayStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.dayStem}</div>
                    <div className="text-xs">{userSaju.dayStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(userSaju.dayBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.dayBranch}</div>
                    <div className="text-xs">{userSaju.dayBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">시주</div>
                <Card className={`border-2 ${getStemColor(userSaju.hourStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.hourStem}</div>
                    <div className="text-xs">{userSaju.hourStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(userSaju.hourBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{userSaju.hourBranch}</div>
                    <div className="text-xs">{userSaju.hourBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* 두 번째 사람 사주 */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg text-center">{partnerName}의 사주</h3>

          {/* 사주 정보 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">년주</div>
                <div className="text-lg font-bold">
                  {partnerSaju.yearStem}
                  {partnerSaju.yearBranch}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">월주</div>
                <div className="text-lg font-bold">
                  {partnerSaju.monthStem}
                  {partnerSaju.monthBranch}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">일주</div>
                <div className="text-lg font-bold">
                  {partnerSaju.dayStem}
                  {partnerSaju.dayBranch}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 sm:p-4 text-center">
                <div className="text-sm text-muted-foreground">시주</div>
                <div className="text-lg font-bold">
                  {partnerSaju.hourStem}
                  {partnerSaju.hourBranch}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오행 분석 */}
          <div className="space-y-2">
            <h4 className="font-medium">오행 분석</h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">목(木)</div>
                  <div className="text-lg font-bold">{partnerSaju.elements.wood}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">화(火)</div>
                  <div className="text-lg font-bold">{partnerSaju.elements.fire}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">토(土)</div>
                  <div className="text-lg font-bold">{partnerSaju.elements.earth}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">금(金)</div>
                  <div className="text-lg font-bold">{partnerSaju.elements.metal}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground">수(水)</div>
                  <div className="text-lg font-bold">{partnerSaju.elements.water}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 사주 다이어그램 */}
          <div className="space-y-2">
            <h4 className="font-medium">사주 다이어그램</h4>
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">년주</div>
                <Card className={`border-2 ${getStemColor(partnerSaju.yearStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.yearStem}</div>
                    <div className="text-xs">{partnerSaju.yearStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(partnerSaju.yearBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.yearBranch}</div>
                    <div className="text-xs">{partnerSaju.yearBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">월주</div>
                <Card className={`border-2 ${getStemColor(partnerSaju.monthStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.monthStem}</div>
                    <div className="text-xs">{partnerSaju.monthStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(partnerSaju.monthBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.monthBranch}</div>
                    <div className="text-xs">{partnerSaju.monthBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">일주</div>
                <Card className={`border-2 ${getStemColor(partnerSaju.dayStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.dayStem}</div>
                    <div className="text-xs">{partnerSaju.dayStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(partnerSaju.dayBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.dayBranch}</div>
                    <div className="text-xs">{partnerSaju.dayBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-center text-xs sm:text-sm text-muted-foreground">시주</div>
                <Card className={`border-2 ${getStemColor(partnerSaju.hourStem)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.hourStem}</div>
                    <div className="text-xs">{partnerSaju.hourStemHanja}</div>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${getBranchColor(partnerSaju.hourBranch)}`}>
                  <CardContent className="p-1 sm:p-2 text-center">
                    <div className="text-base sm:text-lg font-bold">{partnerSaju.hourBranch}</div>
                    <div className="text-xs">{partnerSaju.hourBranchHanja}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오행 비교 */}
      <div className="space-y-4 mt-6">
        <h3 className="font-medium text-lg">오행 비교</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="p-3 text-center">
              <div className="text-sm font-medium text-green-800 dark:text-green-300">목(木)</div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="text-base font-bold">
                  {userName}: {userSaju.elements.wood}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-base font-bold">
                  {partnerName}: {partnerSaju.elements.wood}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardContent className="p-3 text-center">
              <div className="text-sm font-medium text-red-800 dark:text-red-300">화(火)</div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="text-base font-bold">
                  {userName}: {userSaju.elements.fire}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-base font-bold">
                  {partnerName}: {partnerSaju.elements.fire}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-3 text-center">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">토(土)</div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="text-base font-bold">
                  {userName}: {userSaju.elements.earth}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-base font-bold">
                  {partnerName}: {partnerSaju.elements.earth}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-3 text-center">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-300">금(金)</div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="text-base font-bold">
                  {userName}: {userSaju.elements.metal}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-base font-bold">
                  {partnerName}: {partnerSaju.elements.metal}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 text-center">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">수(水)</div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="text-base font-bold">
                  {userName}: {userSaju.elements.water}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-base font-bold">
                  {partnerName}: {partnerSaju.elements.water}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
