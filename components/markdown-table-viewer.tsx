"use client"

import { useState } from "react"
import { parseMarkdownTable } from "@/utils/table-parser"
import ResponsiveTable from "./responsive-table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarkdownTableViewer() {
  const [markdownInput, setMarkdownInput] = useState<string>(`| 기간 | 재물운 흐름 | 특징 |
|:---:|:---:|:---:|
| 1~3월 | 평이함 | 지출/수입 큰 변화 없음, 예산 관리에 집중 |
| 4~6월 | 점진적 상승 | 부수입, 프로젝트 수익, 투잡 등 기회↑ |
| 7~9월 | 최고조 | 투자나 금전 기회 활발, 작은 모험도 긍정적 결과 기대 |
| 10~12월 | 조심 필요 | 무리한 지출·투자 주의. 재정 점검 추천 |`)

  const [tableData, setTableData] = useState(() => {
    try {
      return parseMarkdownTable(markdownInput)
    } catch (error) {
      return { headers: [], rows: [] }
    }
  })

  const [error, setError] = useState<string | null>(null)

  const handleParse = () => {
    try {
      const parsed = parseMarkdownTable(markdownInput)
      setTableData(parsed)
      setError(null)
    } catch (error) {
      setError("테이블 형식이 올바르지 않습니다. 마크다운 테이블 형식을 확인해주세요.")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>마크다운 테이블 변환기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="마크다운 테이블을 입력하세요..."
          value={markdownInput}
          onChange={(e) => setMarkdownInput(e.target.value)}
          className="min-h-[150px] font-mono text-sm"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button onClick={handleParse} className="w-full">
          테이블 변환
        </Button>

        {tableData.headers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">변환된 테이블</h3>
            <ResponsiveTable data={tableData} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
