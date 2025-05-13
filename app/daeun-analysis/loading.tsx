import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DaeunAnalysisLoading() {
  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="w-full mx-auto border-0 sm:border sm:max-w-md">
        <CardHeader className="pb-2">
          <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
          <Skeleton className="h-4 w-4/6 mx-auto mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 대운 다이어그램 로딩 상태 */}
          <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-8 gap-1">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
          </div>

          {/* 대운 상세 해석 로딩 상태 */}
          <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* 버튼 로딩 상태 */}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
