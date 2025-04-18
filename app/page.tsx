import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BirthDateFormClient from "@/components/birth-date-form-client"

export default function Home() {
  // 메인 페이지에 패딩 추가
  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">사주핑 연애운 측정기 </CardTitle>
        </CardHeader>
        <CardContent>
          <BirthDateFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
