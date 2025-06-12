import { type Element, elementEmojis, elementColors, elementTextColors, elementNames } from "@/lib/element-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ElementDisplayProps {
  elements: Record<Element, number>
  maxSlots?: number
  showLabels?: boolean
  className?: string
  displayMode?: "emoji" | "text" | "bar"
}

export function ElementDisplay({
  elements,
  maxSlots = 12,
  showLabels = false,
  className = "",
  displayMode = "text",
}: ElementDisplayProps) {
  // 오행 총합 계산
  const totalElements = Object.values(elements).reduce((sum, count) => sum + count, 0)

  // 오행 배열 생성
  const elementArray: Element[] = []
  Object.entries(elements).forEach(([element, count]) => {
    for (let i = 0; i < count; i++) {
      elementArray.push(element as Element)
    }
  })

  // 빈 슬롯 포함한 전체 슬롯 배열
  const slots: (Element | null)[] = [...elementArray]
  while (slots.length < maxSlots) {
    slots.push(null)
  }

  // 텍스트 모드 렌더링
  if (displayMode === "text") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {Object.entries(elements)
          .filter(([_, count]) => count > 0) // 0인 요소는 표시하지 않음
          .map(([element, count]) => (
            <div
              key={element}
              className={`px-2 py-1 rounded-md ${elementTextColors[element as Element]} bg-opacity-10 border border-current flex items-center gap-1`}
            >
              <span className="font-medium">{elementNames[element as Element].split("(")[0]}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
      </div>
    )
  }

  // 바 차트 모드 렌더링
  if (displayMode === "bar") {
    return (
      <div className={`space-y-2 w-full ${className}`}>
        {Object.entries(elements).map(([element, count]) => {
          const percentage = totalElements > 0 ? (count / totalElements) * 100 : 0
          return (
            <div key={element} className="w-full">
              <div className="flex justify-between text-xs mb-1">
                <span className={elementTextColors[element as Element]}>
                  {elementNames[element as Element].split("(")[0]}
                </span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${elementColors[element as Element]}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 기존 이모지 모드 (fallback)
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {showLabels && (
        <div className="w-full flex justify-between mb-1 text-xs text-muted-foreground">
          {Object.entries(elements).map(([element, count]) => (
            <div key={element} className="flex items-center">
              <span className={`mr-1 ${elementTextColors[element as Element]}`}>
                {elementEmojis[element as Element]}
              </span>
              <span>
                {elementNames[element as Element]}: {count}
              </span>
            </div>
          ))}
        </div>
      )}

      <TooltipProvider>
        <div className="flex flex-wrap gap-1">
          {slots.slice(0, maxSlots).map((element, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    element
                      ? elementColors[element]
                      : "bg-gray-100 dark:bg-gray-800 border-dashed border-gray-300 dark:border-gray-700"
                  }`}
                >
                  {element ? (
                    <span className="text-lg">{elementEmojis[element]}</span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-700 text-xs">+</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>{element ? `${elementNames[element]} 오행` : "비어있는 오행 슬롯"}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}
