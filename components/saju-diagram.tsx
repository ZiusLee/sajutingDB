import { Card, CardContent } from "@/components/ui/card"
import type { Saju } from "@/lib/saju"

interface SajuDiagramProps {
  saju: Saju
  timeUnknown?: boolean
  size?: "sm" | "md" | "lg"
}

export default function SajuDiagram({ saju, timeUnknown = false, size = "md" }: SajuDiagramProps) {
  // 오행 색상 매핑
  const elementColors = {
    wood: "bg-green-100 border-green-500 text-green-800 dark:bg-green-950 dark:border-green-400 dark:text-green-300",
    fire: "bg-red-100 border-red-500 text-red-800 dark:bg-red-950 dark:border-red-400 dark:text-red-300",
    earth:
      "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-300",
    metal: "bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-800 dark:border-gray-400 dark:text-gray-300",
    water: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-300",
    unknown: "bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-700 dark:border-gray-300 dark:text-gray-100",
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
    if (stem === "?") return elementColors.unknown
    return elementColors[stemElements[stem as keyof typeof stemElements]]
  }

  // 지의 오행 색상 가져오기
  const getBranchColor = (branch: string) => {
    if (branch === "?") return elementColors.unknown
    return elementColors[branchElements[branch as keyof typeof branchElements]]
  }

  // Size classes
  const sizeClasses = {
    sm: {
      gap: "gap-1",
      padding: "p-1",
      textStem: "text-xs sm:text-sm",
      textBranch: "text-xs",
      spaceY: "space-y-1",
      labelText: "text-xs",
    },
    md: {
      gap: "gap-2",
      padding: "p-1 sm:p-2",
      textStem: "text-sm sm:text-base md:text-lg",
      textBranch: "text-xs",
      spaceY: "space-y-1 sm:space-y-2",
      labelText: "text-xs sm:text-sm",
    },
    lg: {
      gap: "gap-3",
      padding: "p-2 sm:p-3",
      textStem: "text-base sm:text-lg md:text-xl",
      textBranch: "text-sm",
      spaceY: "space-y-2 sm:space-y-3",
      labelText: "text-sm sm:text-base",
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className={`grid grid-cols-4 ${classes.gap}`}>
      <div className={`${classes.spaceY}`}>
        <div className={`text-center ${classes.labelText} text-muted-foreground`}>시주</div>
        {timeUnknown ? (
          <>
            <Card className="border-2 border-dashed border-gray-400 dark:border-gray-500">
              <CardContent className={`${classes.padding} text-center`}>
                <div className={`${classes.textStem} font-bold text-gray-600 dark:text-gray-300`}>?</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">?</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed border-gray-400 dark:border-gray-500">
              <CardContent className={`${classes.padding} text-center`}>
                <div className={`${classes.textStem} font-bold text-gray-600 dark:text-gray-300`}>?</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">?</div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className={`border shadow-sm ${getStemColor(saju.hourStem)}`}>
              <CardContent className={`${classes.padding} text-center`}>
                <div className={`${classes.textStem} font-bold`}>{saju.hourStem}</div>
                <div className={`${classes.textBranch}`}>{saju.hourStemHanja}</div>
              </CardContent>
            </Card>
            <Card className={`border shadow-sm ${getBranchColor(saju.hourBranch)}`}>
              <CardContent className={`${classes.padding} text-center`}>
                <div className={`${classes.textStem} font-bold`}>{saju.hourBranch}</div>
                <div className={`${classes.textBranch}`}>{saju.hourBranchHanja}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className={`${classes.spaceY}`}>
        <div className={`text-center ${classes.labelText} text-muted-foreground`}>일주</div>
        <Card className={`border shadow-sm ${getStemColor(saju.dayStem)}`}>
          <CardContent className={`${classes.padding} text-center`}>
            <div className={`${classes.textStem} font-bold`}>{saju.dayStem}</div>
            <div className={`${classes.textBranch}`}>{saju.dayStemHanja}</div>
          </CardContent>
        </Card>
        <Card className={`border shadow-sm ${getBranchColor(saju.dayBranch)}`}>
          <CardContent className={`${classes.padding} text-center`}>
            <div className={`${classes.textStem} font-bold`}>{saju.dayBranch}</div>
            <div className={`${classes.textBranch}`}>{saju.dayBranchHanja}</div>
          </CardContent>
        </Card>
      </div>

      <div className={`${classes.spaceY}`}>
        <div className={`text-center ${classes.labelText} text-muted-foreground`}>월주</div>
        <Card className={`border shadow-sm ${getStemColor(saju.monthStem)}`}>
          <CardContent className={`${classes.padding} text-center`}>
            <div className={`${classes.textStem} font-bold`}>{saju.monthStem}</div>
            <div className={`${classes.textBranch}`}>{saju.monthStemHanja}</div>
          </CardContent>
        </Card>
        <Card className={`border shadow-sm ${getBranchColor(saju.monthBranch)}`}>
          <CardContent className={`${classes.padding} text-center`}>
            <div className={`${classes.textStem} font-bold`}>{saju.monthBranch}</div>
            <div className={`${classes.textBranch}`}>{saju.monthBranchHanja}</div>
          </CardContent>
        </Card>
      </div>

      <div className={`${classes.spaceY}`}>
        <div className={`text-center ${classes.labelText} text-muted-foreground`}>년주</div>
        <Card className={`border shadow-sm ${getStemColor(saju.yearStem)}`}>
          <CardContent className={`${classes.padding} text-center`}>
            <div className={`${classes.textStem} font-bold`}>{saju.yearStem}</div>
            <div className={`${classes.textBranch}`}>{saju.yearStemHanja}</div>
          </CardContent>
        </Card>
        <Card className={`border shadow-sm ${getBranchColor(saju.yearBranch)}`}>
          <CardContent className={`${classes.padding} text-center`}>
            <div className={`${classes.textStem} font-bold`}>{saju.yearBranch}</div>
            <div className={`${classes.textBranch}`}>{saju.yearBranchHanja}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
