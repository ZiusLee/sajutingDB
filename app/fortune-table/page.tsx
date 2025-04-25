import FortuneTable from "@/components/fortune-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FortunePage() {
  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">2024년 재물운 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <FortuneTable />
        </CardContent>
      </Card>
    </div>
  )
}
