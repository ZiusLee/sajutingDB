import { Card, CardContent } from "@/components/ui/card"
import type { SajuPillar } from "@/types/saju"

interface SajuDiagramProps {
  pillars: SajuPillar
  className?: string
}

export function SajuDiagram({ pillars, className = "" }: SajuDiagramProps) {
  const getElementColor = (element: string) => {
    const colors = {
      목: "text-green-700 bg-green-50 border-green-200",
      화: "text-red-700 bg-red-50 border-red-200",
      토: "text-amber-700 bg-amber-50 border-amber-200",
      금: "text-slate-700 bg-slate-50 border-slate-200",
      수: "text-blue-700 bg-blue-50 border-blue-200",
    }
    return colors[element as keyof typeof colors] || "text-slate-700 bg-slate-50 border-slate-200"
  }

  const PillarCard = ({
    title,
    heavenly,
    earthly,
    element,
    yinYang,
  }: {
    title: string
    heavenly: string
    earthly: string
    element: string
    yinYang: string
  }) => (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-slate-600 mb-2">{title}</div>
      <Card className={`w-16 h-20 ${getElementColor(element)} border-2`}>
        <CardContent className="p-2 flex flex-col items-center justify-center h-full">
          <div className="text-lg font-bold">{heavenly}</div>
          <div className="text-sm">{earthly}</div>
          <div className="text-xs mt-1 opacity-75">{yinYang}</div>
        </CardContent>
      </Card>
      <div className="text-xs text-slate-500 mt-1">{element}</div>
    </div>
  )

  return (
    <div className={`bg-gradient-to-br from-amber-50 to-blue-50 p-6 rounded-xl ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">사주 명식</h3>
        <p className="text-sm text-slate-600">四柱命式</p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
        <PillarCard
          title="년주"
          heavenly={pillars.year.heavenly}
          earthly={pillars.year.earthly}
          element={pillars.year.element}
          yinYang={pillars.year.yin_yang}
        />
        <PillarCard
          title="월주"
          heavenly={pillars.month.heavenly}
          earthly={pillars.month.earthly}
          element={pillars.month.element}
          yinYang={pillars.month.yin_yang}
        />
        <PillarCard
          title="일주"
          heavenly={pillars.day.heavenly}
          earthly={pillars.day.earthly}
          element={pillars.day.element}
          yinYang={pillars.day.yin_yang}
        />
        {pillars.hour ? (
          <PillarCard
            title="시주"
            heavenly={pillars.hour.heavenly}
            earthly={pillars.hour.earthly}
            element={pillars.hour.element}
            yinYang={pillars.hour.yin_yang}
          />
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-xs font-medium text-slate-600 mb-2">시주</div>
            <Card className="w-16 h-20 border-2 border-dashed border-slate-300">
              <CardContent className="p-2 flex flex-col items-center justify-center h-full">
                <div className="text-xs text-slate-400">시간</div>
                <div className="text-xs text-slate-400">미상</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <div className="text-sm text-slate-600">
          <span className="font-medium">일간:</span> {pillars.day.heavenly} ({pillars.day.element})
        </div>
      </div>
    </div>
  )
}
