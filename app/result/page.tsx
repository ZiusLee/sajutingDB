"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import SajuResultClient from "@/components/saju-result-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DaeunDiagram from "@/components/daeun-diagram"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

export default function ResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("interpretation")
  const [sajuData, setSajuData] = useState<any>(null)
  const [name, setName] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [model, setModel] = useState<string>("gpt-4o")
  const [relationshipStatus, setRelationshipStatus] = useState<string>("solo")
  const [interpretation, setInterpretation] = useState<string | null>(null)

  useEffect(() => {
    // URL 파라미터에서 데이터 가져오기
    const sajuParam = searchParams.get("saju")
    const nameParam = searchParams.get("name")
    const genderParam = searchParams.get("gender")
    const modelParam = searchParams.get("model")
    const relationshipStatusParam = searchParams.get("relationshipStatus")
    const interpretationParam = searchParams.get("interpretation")

    if (sajuParam) {
      try {
        const parsedSaju = JSON.parse(sajuParam)
        setSajuData(parsedSaju)
      } catch (error) {
        console.error("Error parsing saju data:", error)
      }
    }

    if (nameParam) setName(nameParam)
    if (genderParam) setGender(genderParam)
    if (modelParam) setModel(modelParam)
    if (relationshipStatusParam) setRelationshipStatus(relationshipStatusParam)
    if (interpretationParam) setInterpretation(interpretationParam)
  }, [searchParams])

  const handleGoBack = () => {
    router.back()
  }

  if (!sajuData) {
    const date = searchParams.get("date")
    const hour = searchParams.get("hour")
    const minute = searchParams.get("minute")
    const timeUnknown = searchParams.get("timeUnknown")
    const name = searchParams.get("name")
    const gender = searchParams.get("gender")
    const sajuParam = searchParams.get("saju")
    const location = searchParams.get("location")
    const uuid = searchParams.get("uuid")

    // If no parameters are provided, show a message and link to home
    if (!date && !uuid && !sajuParam) {
      return (
        <div className="container mx-auto py-10 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-2xl">사주 정보 필요</CardTitle>
              <CardDescription className="text-center">사주 결과를 보려면 필요한 정보를 입력해주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center">사주 정보가 없습니다. 홈페이지로 이동하여 사주 정보를 입력해주세요.</p>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/">홈으로 이동</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // UUID로 사주 데이터 조회 (마이페이지에서 상세 보기로 접근한 경우)
    if (uuid) {
      return (
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">사주 정보를 불러오는 중입니다...</h2>
            <p className="text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        </div>
      )
    }

    // 사주 파라미터가 있는 경우 (채팅 목록에서 돌아온 경우 또는 마이페이지에서 직접 전달된 경우)
    if (sajuParam) {
      return (
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">사주 정보를 불러오는 중입니다...</h2>
            <p className="text-muted-foreground">잠시만 기다려주세요.</p>
          </div>
        </div>
      )
    }

    // 기존 로직 (직접 날짜 파라미터로 접근한 경우)
    if (!date || !hour || !minute) {
      return (
        <div className="container mx-auto py-10 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-2xl">필수 정보 누락</CardTitle>
              <CardDescription className="text-center">
                사주 결과를 보려면 날짜와 시간 정보가 필요합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center">날짜, 시간 정보가 누락되었습니다. 홈페이지로 이동하여 정보를 입력해주세요.</p>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/">홈으로 이동</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">사주 정보를 불러오는 중입니다...</h2>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">{name ? `${name}님의 사주 해석` : "사주 해석 결과"}</h1>
        <p className="text-muted-foreground mt-1">
          {gender === "male" ? "남성" : gender === "female" ? "여성" : ""}
          {sajuData.lunarYear && sajuData.lunarMonth && sajuData.lunarDay
            ? ` | ${sajuData.lunarYear}년 ${sajuData.lunarMonth}월 ${sajuData.lunarDay}일`
            : ""}
          {sajuData.lunarHour ? ` ${sajuData.lunarHour}시` : ""}
        </p>
      </div>

      <Tabs defaultValue="interpretation" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="interpretation">사주 해석</TabsTrigger>
          <TabsTrigger value="daeun">10년 대운</TabsTrigger>
        </TabsList>

        <TabsContent value="interpretation" className="space-y-6">
          <SajuResultClient
            saju={sajuData}
            name={name}
            gender={gender}
            model={model}
            relationshipStatus={relationshipStatus}
            interpretation={interpretation}
            setInterpretation={setInterpretation}
          />

          {/* 추가 질문하기 컴포넌트 주석 처리 */}
          {/* <AdditionalQuestions
            saju={sajuData}
            name={name}
            gender={gender}
            model={model}
            relationshipStatus={relationshipStatus}
            interpretation={interpretation}
          /> */}
        </TabsContent>

        <TabsContent value="daeun">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                10년 대운 분석
              </CardTitle>
              <CardDescription>
                10년 대운은 인생의 큰 흐름을 나타내는 지표로, 각 10년 단위로 운세의 변화를 보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DaeunDiagram saju={sajuData} gender={gender} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
