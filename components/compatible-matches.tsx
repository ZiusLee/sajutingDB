"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface CompatibleMatch {
  id: string
  name: string
  age: number
  birthYear: string
  saju: string
  compatibility: string
  compatibilityScore: number
  imageUrl: string
}

interface CompatibleMatchesProps {
  sajuText: string
  gender?: string
  relationshipStatus?: string
}

export default function CompatibleMatches({
  sajuText,
  gender = "male",
  relationshipStatus = "solo",
}: CompatibleMatchesProps) {
  const router = useRouter()
  const handleIntroClick = () => {
    // 사주 데이터를 localStorage에 저장
    if (sajuText) {
      try {
        // 기존 데이터가 있으면 가져오기
        const tempData = localStorage.getItem("tempSajuData")
        const sajuData = tempData ? JSON.parse(tempData) : {}

        // 사주 정보 추가 (sajuText는 AI 해석 내용)
        sajuData.sajuInterpretation = sajuText

        // 현재 페이지에서 사용 가능한 전역 변수 확인
        console.log("Current window.sajuInfo:", window.sajuInfo)
        console.log("Current window.sajuFullData:", window.sajuFullData)

        // 전역 변수에서 데이터를 가져와 병합
        if (window.sajuFullData) {
          // 중요한 필드들을 명시적으로 복사
          if (window.sajuFullData.year) sajuData.year = String(window.sajuFullData.year)
          if (window.sajuFullData.month) sajuData.month = String(window.sajuFullData.month)
          if (window.sajuFullData.day) sajuData.day = String(window.sajuFullData.day)
          if (window.sajuFullData.hour !== undefined) sajuData.hour = String(window.sajuFullData.hour)
          if (window.sajuFullData.minute !== undefined) sajuData.minute = String(window.sajuFullData.minute)
          if (window.sajuFullData.name) sajuData.name = window.sajuFullData.name

          // 기타 필요한 데이터 복사
          if (window.sajuFullData.yearStem) sajuData.yearStem = window.sajuFullData.yearStem
          if (window.sajuFullData.yearBranch) sajuData.yearBranch = window.sajuFullData.yearBranch
          if (window.sajuFullData.monthStem) sajuData.monthStem = window.sajuFullData.monthStem
          if (window.sajuFullData.monthBranch) sajuData.monthBranch = window.sajuFullData.monthBranch
          if (window.sajuFullData.dayStem) sajuData.dayStem = window.sajuFullData.dayStem
          if (window.sajuFullData.dayBranch) sajuData.dayBranch = window.sajuFullData.dayBranch
          if (window.sajuFullData.hourStem) sajuData.hourStem = window.sajuFullData.hourStem
          if (window.sajuFullData.hourBranch) sajuData.hourBranch = window.sajuFullData.hourBranch
        }

        // 성별 정보 저장
        sajuData.gender = gender

        // 관계 상태 저장
        sajuData.relationshipStatus = relationshipStatus

        // 디버깅을 위해 저장할 데이터 출력
        console.log("Saving to localStorage:", sajuData)

        localStorage.setItem("tempSajuData", JSON.stringify(sajuData))

        // 전역 변수로 사주 정보 저장 (다른 컴포넌트에서 접근 가능하���록)
        window.sajuFullData = sajuData
      } catch (e) {
        console.error("Error saving saju data:", e)
      }
    }

    // activate 페이지로 이동
    router.push("/activate")
  }

  // Extract matches based on gender and relationship status
  const extractMatches = (text: string, gender: string, relationshipStatus: string): CompatibleMatch[] => {
    // Determine opposite gender for matches
    const matchGender = gender === "male" ? "female" : "male"

    // Different dummy data based on the user's gender and relationship status
    if (matchGender === "female") {
      // For male users looking for female matches
      if (relationshipStatus === "solo") {
        return [
          {
            id: "1",
            name: "김○○",
            age: 28,
            birthYear: "1996년생",
            saju: "갑인-을사-병오-정미",
            compatibility: "당신에게 부족한 금(金)과 수(水) 오행이 풍부하여 상호 보완적인 관계",
            compatibilityScore: 85,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "이○○",
            age: 30,
            birthYear: "1994년생",
            saju: "임신-계유-갑술-을해",
            compatibility: "당신의 부족한 수(水) 오행을 보완해주고 오행 균형이 좋은 관계",
            compatibilityScore: 92,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "박○○",
            age: 26,
            birthYear: "1998년생",
            saju: "무진-기사-경오-신미",
            compatibility: "당신에게 부족한 금(金)과 토(土) 오행이 풍부한 조화로운 관계",
            compatibilityScore: 78,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else if (relationshipStatus === "flirting") {
        return [
          {
            id: "1",
            name: "정○○",
            age: 27,
            birthYear: "1997년생",
            saju: "정축-무인-기묘-경진",
            compatibility: "썸 단계에서 호감을 발전시키기 좋은 오행 구성, 대화가 잘 통하는 관계",
            compatibilityScore: 88,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "최○○",
            age: 29,
            birthYear: "1995년생",
            saju: "을해-병자-정축-무인",
            compatibility: "서로의 감정을 솔직하게 표현할 수 있는 관계, 연애로 발전 가능성 높음",
            compatibilityScore: 90,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "한○○",
            age: 25,
            birthYear: "1999년생",
            saju: "기묘-경진-신사-임오",
            compatibility: "서로에게 호기심을 느끼고 지속적인 관심을 유지할 수 있는 관계",
            compatibilityScore: 82,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else if (relationshipStatus === "dating") {
        return [
          {
            id: "1",
            name: "윤○○",
            age: 28,
            birthYear: "1996년생",
            saju: "병신-정유-무술-기해",
            compatibility: "장기적인 연애 관계로 발전하기 좋은 궁합, 서로의 성장을 도와주는 관계",
            compatibilityScore: 91,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "서○○",
            age: 31,
            birthYear: "1993년생",
            saju: "계유-갑술-을해-병자",
            compatibility: "갈등 해결 능력이 뛰어나고 서로를 이해하는 깊이 있는 관계",
            compatibilityScore: 87,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "조○○",
            age: 27,
            birthYear: "1997년생",
            saju: "정축-무인-기묘-경진",
            compatibility: "서로의 부족한 부분을 채워주는 균형 잡힌 관계, 결혼으로 발전 가능성 높음",
            compatibilityScore: 94,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else if (relationshipStatus === "married") {
        return [
          {
            id: "1",
            name: "장○○",
            age: 32,
            birthYear: "1992년생",
            saju: "임신-계유-갑술-을해",
            compatibility: "안정적인 가정을 이루고 서로를 지지하는 든든한 배우자 관계",
            compatibilityScore: 95,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "임○○",
            age: 30,
            birthYear: "1994년생",
            saju: "갑인-을묘-병진-정사",
            compatibility: "자녀 양육과 가정 경제에 있어 조화로운 역할 분담이 가능한 관계",
            compatibilityScore: 89,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "신○○",
            age: 33,
            birthYear: "1991년생",
            saju: "신미-임신-계유-갑술",
            compatibility: "오랜 시간이 지나도 서로에 대한 존중과 애정이 유지되는 관계",
            compatibilityScore: 93,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else {
        // Default matches
        return [
          {
            id: "1",
            name: "김○○",
            age: 28,
            birthYear: "1996년생",
            saju: "��인-을사-병오-정미",
            compatibility: "당신에게 부족한 금(金)과 수(水) 오행이 풍부하여 상호 보완적인 관계",
            compatibilityScore: 85,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "이○○",
            age: 30,
            birthYear: "1994년생",
            saju: "임신-���유-갑술-을해",
            compatibility: "당신의 부족한 수(水) 오행을 보완해주고 오행 균형이 좋은 관계",
            compatibilityScore: 92,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "박○○",
            age: 26,
            birthYear: "1998년생",
            saju: "무진-기사-경오-신미",
            compatibility: "당신에게 부족한 금(金)과 토(土) 오행이 풍부한 조화로운 관계",
            compatibilityScore: 78,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      }
    } else {
      // For female users looking for male matches
      if (relationshipStatus === "solo") {
        return [
          {
            id: "1",
            name: "정○○",
            age: 27,
            birthYear: "1997년생",
            saju: "정축-무인-기묘-경진",
            compatibility: "당신에게 부족한 화(火)와 토(土) 오행이 풍부한 안정적인 궁합",
            compatibilityScore: 88,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "최○○",
            age: 29,
            birthYear: "1995년생",
            saju: "을해-병자-정축-무인",
            compatibility: "당신의 부족한 화(火) 오행을 보완해주는 상호 보완적인 관계",
            compatibilityScore: 90,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "한○○",
            age: 25,
            birthYear: "1999년생",
            saju: "기묘-경진-신사-임오",
            compatibility: "당신에게 부족한 금(金)과 수(水) 오행이 풍부한 조화로운 관계",
            compatibilityScore: 82,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else if (relationshipStatus === "flirting") {
        return [
          {
            id: "1",
            name: "김○○",
            age: 30,
            birthYear: "1994년생",
            saju: "갑인-을묘-병진-정사",
            compatibility: "썸 단계에서 자연스럽게 대화가 이어지고 호감이 깊어지는 관계",
            compatibilityScore: 87,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "이○○",
            age: 32,
            birthYear: "1992년생",
            saju: "임신-계유-갑술-을해",
            compatibility: "서로에게 호기심을 느끼고 더 알아가고 싶은 마음이 커지는 관계",
            compatibilityScore: 89,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "박○○",
            age: 28,
            birthYear: "1996년생",
            saju: "병신-정유-무술-기해",
            compatibility: "자연스럽게 연애로 발전할 가능성이 높은 편안한 관계",
            compatibilityScore: 91,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else if (relationshipStatus === "dating") {
        return [
          {
            id: "1",
            name: "윤○○",
            age: 31,
            birthYear: "1993년생",
            saju: "계유-갑술-을해-병자",
            compatibility: "서로의 가치관을 존중하고 함께 성장할 수 있는 안정적인 연애 관계",
            compatibilityScore: 93,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "서○○",
            age: 29,
            birthYear: "1995년생",
            saju: "을해-병자-정축-무인",
            compatibility: "갈등이 생겨도 대화로 잘 풀어나갈 수 있는 소통이 원활한 관계",
            compatibilityScore: 88,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "조○○",
            age: 33,
            birthYear: "1991년생",
            saju: "신미-임신-계유-갑술",
            compatibility: "서로의 미래를 함께 그려나갈 수 있는 장기적인 관계 가능성",
            compatibilityScore: 95,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else if (relationshipStatus === "married") {
        return [
          {
            id: "1",
            name: "장○○",
            age: 34,
            birthYear: "1990년생",
            saju: "경오-신미-임신-계유",
            compatibility: "가정을 이루고 함께 성장하며 서로를 지지하는 든든한 배우자 관계",
            compatibilityScore: 94,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "임○○",
            age: 32,
            birthYear: "1992년생",
            saju: "임신-계유-갑술-을해",
            compatibility: "자녀 교육과 가정 관리에 있어 조화로운 역할 분담이 가능한 관계",
            compatibilityScore: 91,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "신○○",
            age: 35,
            birthYear: "1989년생",
            saju: "기사-경오-신미-임신",
            compatibility: "서로의 개성을 존중하며 오랜 시간 함께할 수 있는 안정적인 관계",
            compatibilityScore: 89,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      } else {
        // Default matches
        return [
          {
            id: "1",
            name: "정○○",
            age: 27,
            birthYear: "1997년생",
            saju: "정축-무인-기묘-경진",
            compatibility: "당신에게 부족한 화(火)와 토(土) 오행이 풍부한 안정적인 궁합",
            compatibilityScore: 88,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "2",
            name: "최○○",
            age: 29,
            birthYear: "1995년생",
            saju: "을해-병자-정축-무인",
            compatibility: "당신의 부족한 화(火) 오행을 보완해주는 상호 보완적인 관계",
            compatibilityScore: 90,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
          {
            id: "3",
            name: "한○○",
            age: 25,
            birthYear: "1999년생",
            saju: "기묘-경진-신사-임오",
            compatibility: "당신에게 부족한 금(金)과 수(水) 오행이 풍부한 조화로운 관계",
            compatibilityScore: 82,
            imageUrl: "/placeholder.svg?height=150&width=150",
          },
        ]
      }
    }
  }

  const matches = extractMatches(sajuText, gender, relationshipStatus)

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">궁합이 좋은 추천 인연</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden border-0 shadow-sm sm:border">
            <div className="relative h-32 sm:h-40 w-full">
              <div className="absolute inset-0 backdrop-blur-md bg-gray-100/30 flex items-center justify-center">
                <Image
                  src={match.imageUrl || "/placeholder.svg"}
                  alt={match.name}
                  width={150}
                  height={150}
                  className="rounded-full w-20 h-20 sm:w-24 sm:h-24 object-cover blur-sm"
                />
              </div>
            </div>
            <CardContent className="p-2 sm:p-3 md:p-4">
              <h4 className="font-bold text-xs sm:text-sm md:text-base">
                {match.name} ({match.age}세, {match.birthYear})
              </h4>
              <p className="text-xs sm:text-sm mt-1">
                <span className="font-medium">사주:</span> {match.saju}
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
                <p className="text-xs text-muted-foreground line-clamp-2">{match.compatibility}</p>
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary whitespace-nowrap">
                  궁합 {match.compatibilityScore}점
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Button
          onClick={handleIntroClick}
          className="bg-primary hover:bg-primary/90 py-2.5 text-base w-full sm:w-auto"
          size="lg"
        >
          소개받기
        </Button>
      </div>
    </div>
  )
}
