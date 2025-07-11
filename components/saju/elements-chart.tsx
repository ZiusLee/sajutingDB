import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ElementsChartProps {
  elements: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
}

export function ElementsChart({ elements }: ElementsChartProps) {
  const total = Object.values(elements).reduce((sum, value) => sum + value, 0)

  const elementData = [
    { name: "목", value: elements.wood, color: "bg-green-500", textColor: "text-green-700" },
    { name: "화", value: elements.fire, color: "bg-red-500", textColor: "text-red-700" },
    { name: "토", value: elements.earth, color: "bg-amber-500", textColor: "text-amber-700" },
    { name: "금", value: elements.metal, color: "bg-slate-500", textColor: "text-slate-700" },
    { name: "수", value: elements.water, color: "bg-blue-500", textColor: "text-blue-700" },
  ]

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-800 text-center">오행 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {elementData.map((element) => {
            const percentage = total > 0 ? (element.value / total) * 100 : 0

            return (
              <div key={element.name} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full ${element.color} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {element.name}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium ${element.textColor}`}>{element.name}행</span>
                    <span className="text-sm text-slate-600">
                      {element.value}개 ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`${element.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-600 text-center">오행의 균형이 인생의 조화를 나타냅니다</p>
        </div>
      </CardContent>
    </Card>
  )
}
