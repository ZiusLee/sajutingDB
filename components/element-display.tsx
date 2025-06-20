import { type Element, elementEmojis, elementColors, elementTextColors, elementNames } from "@/lib/element-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ElementDisplayProps {
  elements: Record<Element, number>
  maxSlots?: number
  showLabels?: boolean
  className?: string
}

export function ElementDisplay({ elements, maxSlots = 12, showLabels = false, className = "" }: ElementDisplayProps) {
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
