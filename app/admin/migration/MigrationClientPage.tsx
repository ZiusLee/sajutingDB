"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

interface MigrationClientPageProps {
  userId: string
}

export default function MigrationClientPage({ userId }: MigrationClientPageProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [processedRecords, setProcessedRecords] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const handleMigrateSibseong = async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)
    setIsComplete(false)

    try {
      // 마이그레이션 시작
      const startResponse = await fetch("/api/admin/migrate-sibseong/start", {
        method: "POST",
      })

      if (!startResponse.ok) {
        const errorData = await startResponse.json()
        throw new Error(errorData.message || "마이그레이션 시작 실패")
      }

      const { totalCount } = await startResponse.json()
      setTotalRecords(totalCount)

      // 진행 상황 폴링
      const pollProgress = async () => {
        const progressResponse = await fetch("/api/admin/migrate-sibseong/progress")

        if (!progressResponse.ok) {
          const errorData = await progressResponse.json()
          throw new Error(errorData.message || "진행 상황 조회 실패")
        }

        const { processed, total, isCompleted, error } = await progressResponse.json()

        if (error) {
          setError(error)
          setIsLoading(false)
          return
        }

        setProcessedRecords(processed)
        setProgress(Math.floor((processed / total) * 100))

        if (isCompleted) {
          setIsComplete(true)
          setIsLoading(false)
          toast({
            title: "마이그레이션 완료",
            description: `총 ${processed}개의 사주 데이터에 십성 정보가 추가되었습니다.`,
          })
        } else {
          // 계속 폴링
          setTimeout(pollProgress, 1000)
        }
      }

      // 폴링 시작
      pollProgress()
    } catch (err) {
      console.error("마이그레이션 오류:", err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
      setIsLoading(false)

      toast({
        title: "마이그레이션 오류",
        description: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">데이터 마이그레이션</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>십성 데이터 마이그레이션</CardTitle>
          <CardDescription>
            기존 사주 데이터에 십성(十星) 정보를 추가합니다. 이 작업은 시간이 걸릴 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4 mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {processedRecords} / {totalRecords} 처리 중... ({progress}%)
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
              <p className="font-medium">오류 발생</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isComplete && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
              <p className="font-medium">마이그레이션 완료</p>
              <p className="text-sm">총 {processedRecords}개의 사주 데이터에 십성 정보가 추가되었습니다.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleMigrateSibseong} disabled={isLoading}>
            {isLoading ? "처리 중..." : "십성 데이터 마이그레이션 시작"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
