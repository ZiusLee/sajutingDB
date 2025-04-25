"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAdditionalInterpretation } from "@/lib/api-client"
// 필요한 import 추가 (파일 상단)
import { getLoveDetailedAnalysis } from "@/lib/api-client"
import ReactMarkdown from "react-markdown"
import { Loader2, MessageCircle, PlusCircle, Send, Users, Trash2, UserPlus, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getCompatibilityAnalysis } from "@/lib/api-client"
import CompatibilityComparison from "@/components/compatibility-comparison"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import {
  saveCompatibilityResultToLocalStorage,
  savePartnerInfo,
  getSavedPartners,
  deletePartnerInfo,
  type PartnerInfo,
} from "@/lib/data-sync"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

interface AdditionalQuestionsProps {
  saju: any
  name: string
  gender: string
  model: string
  relationshipStatus?: string
  interpretation?: string
}

interface CompatibilityResultCardProps {
  result: string | null
  onReset: () => void
}

const CompatibilityResultCardComponent: React.FC<CompatibilityResultCardProps> = ({ result, onReset }) => {
  return (
    <>
      <div className="mt-6 space-y-4">
        <h3 className="font-medium text-lg">궁합 분석 결과</h3>
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100 dark:from-pink-950 dark:to-purple-950 dark:border-pink-800 dark:text-gray-100">
          <CardContent className="p-4">
            <div className="markdown-content">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={onReset} className="mt-4" variant="outline">
        다시 분석하기
      </Button>
    </>
  )
}

export default function AdditionalQuestions({
  saju,
  name,
  gender,
  model,
  relationshipStatus = "solo",
  interpretation = "",
}: AdditionalQuestionsProps) {
  const router = useRouter()
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null)
  const [interpretations, setInterpretations] = useState<Record<string, string | null>>({})
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [customQuestion, setCustomQuestion] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const customInputRef = useRef<HTMLInputElement>(null)

  // 모바일 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  // 궁합 분석 관련 상태
  const [showCompatibilityForm, setShowCompatibilityForm] = useState(false) // 기본값을 false로 변경
  const [partnerName, setPartnerName] = useState("")
  const [partnerGender, setPartnerGender] = useState("female")
  const [partnerYear, setPartnerYear] = useState("")
  const [partnerMonth, setPartnerMonth] = useState("")
  const [partnerDay, setPartnerDay] = useState("")
  const [partnerTime, setPartnerTime] = useState("")
  const [partnerTimeUnknown, setPartnerTimeUnknown] = useState(false)
  const [partnerRelationshipStatus, setPartnerRelationshipStatus] = useState<string>(relationshipStatus)
  const [compatibilityResult, setCompatibilityResult] = useState<string | null>(null)
  const [isAnalyzingCompatibility, setIsAnalyzingCompatibility] = useState(false)
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null)
  const [partnerSaju, setPartnerSaju] = useState<any>(null)

  // 저장된 상대방 정보 관련 상태
  const [savedPartners, setSavedPartners] = useState<PartnerInfo[]>([])
  const [showSavedPartners, setShowSavedPartners] = useState(false)

  // 로딩 상태 및 시간 관리
  const [loadingStage, setLoadingStage] = useState("사주 분석 준비")
  const [loadingTimeLeft, setLoadingTimeLeft] = useState<number>(60) // 초기 예상 시간 (초)
  const [loadingProgress, setLoadingProgress] = useState(0) // 로딩 진행률 (0-100%)

  // 사주 정보 추출
  const { dayStem, dayBranch } = saju || { dayStem: "", dayBranch: "" }

  // 현재 연도부터 1900년까지의 연도 배열 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => (currentYear - i).toString())

  // 월 배열 생성 (01-12)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  // 일 배열 생성 (01-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  // 모바일 감지
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // 저장된 상대방 정보 로드
  useEffect(() => {
    const partners = getSavedPartners()
    setSavedPartners(partners)
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (loadingCategory) {
      setLoadingTimeLeft(60) // 초기화
      setLoadingProgress(0) // 진행률 초기화
      setLoadingStage("사주 분석 준비")

      intervalId = setInterval(() => {
        setLoadingTimeLeft((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(intervalId!)
            return 0
          }

          // 로딩 단계 업데이트
          if (prevTime <= 45) {
            setLoadingStage("운세 분석 마무리")
          } else if (prevTime <= 50) {
            setLoadingStage("운세 분석 중")
          } else if (prevTime <= 55) {
            setLoadingStage("사주 정보 확인 중")
          }

          // 진행률 업데이트 (60초에서 0초까지 감소하면서 0%에서 100%로 증가)
          const newProgress = Math.min(100, Math.max(0, Math.round(((60 - prevTime) / 60) * 100)))
          setLoadingProgress(newProgress)

          return prevTime - 1
        })
      }, 1000)
    } else {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [loadingCategory])

  // handleCategoryClick 함수 수정 (약 라인 170 근처)
  const handleCategoryClick = async (category: string) => {
    // 이미 활성화된 카테고리인 경우 토글
    if (activeCategories.includes(category)) {
      setActiveCategories(activeCategories.filter((c) => c !== category))
      return
    }

    // 활성화된 카테고리에 추가
    setActiveCategories([...activeCategories, category])

    // 이미 해석이 있는 경우 다시 요청하지 않음
    if (interpretations[category]) return

    setLoadingCategory(category)
    setErrors({ ...errors, [category]: null })

    try {
      let result

      // 연애운 상세 분석인 경우 다른 API 호출
      if (category === "love-detailed-analysis") {
        result = await getLoveDetailedAnalysis(saju, name, gender, relationshipStatus)
      } else {
        result = await getAdditionalInterpretation(saju, name, gender, model, category, relationshipStatus)
      }

      setInterpretations({ ...interpretations, [category]: result.interpretation })
    } catch (err) {
      console.error(`Error fetching interpretation for ${category}:`, err)
      setErrors({
        ...errors,
        [category]: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      })
    } finally {
      setLoadingCategory(null)
    }
  }

  const handleCustomQuestionSubmit = async () => {
    if (!customQuestion.trim()) return

    const customCategoryId = `custom:${customQuestion}`

    // 활성화된 카테고리에 추가
    setActiveCategories([...activeCategories, customCategoryId])
    setLoadingCategory(customCategoryId)
    setErrors({ ...errors, [customCategoryId]: null })

    try {
      const result = await getAdditionalInterpretation(saju, name, gender, model, customCategoryId, relationshipStatus)
      setInterpretations({ ...interpretations, [customCategoryId]: result.interpretation })
    } catch (err) {
      console.error(`Error fetching interpretation for custom question:`, err)
      setErrors({
        ...errors,
        [customCategoryId]: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      })
    } finally {
      setLoadingCategory(null)
      setCustomQuestion("")
      setShowCustomInput(false)
    }
  }

  // 상대방 정보 저장 핸들러
  const handleSavePartner = () => {
    if (!partnerName || !partnerYear || !partnerMonth || !partnerDay) {
      toast({
        title: "필수 정보 누락",
        description: "이름과 생년월일은 필수 입력 항목입니다.",
        variant: "destructive",
      })
      return
    }

    // 파트너의 시간 정보 처리
    let partnerHour = 0
    let partnerMinute = 0

    if (!partnerTimeUnknown && partnerTime) {
      // 시간 입력값 파싱
      if (partnerTime.includes(":")) {
        const [hourStr, minuteStr] = partnerTime.split(":")
        partnerHour = Number.parseInt(hourStr, 10)
        partnerMinute = Number.parseInt(minuteStr, 10)
      } else if (partnerTime.length === 4) {
        partnerHour = Number.parseInt(partnerTime.substring(0, 2), 10)
        partnerMinute = Number.parseInt(partnerTime.substring(2), 10)
      } else {
        partnerHour = Number.parseInt(partnerTime, 10)
        partnerMinute = 0
      }
    }

    // 상대방 정보 객체 생성
    const partnerInfo: PartnerInfo = {
      name: partnerName,
      gender: partnerGender,
      year: Number.parseInt(partnerYear),
      month: Number.parseInt(partnerMonth),
      day: Number.parseInt(partnerDay),
      hour: partnerTimeUnknown ? null : partnerHour,
      minute: partnerTimeUnknown ? null : partnerMinute,
      timeUnknown: partnerTimeUnknown,
      relationshipStatus: partnerRelationshipStatus,
    }

    // 상대방 정보 저장
    const partnerId = savePartnerInfo(partnerInfo)

    if (partnerId) {
      // 저장된 상대방 목록 업데이트
      const updatedPartners = getSavedPartners()
      setSavedPartners(updatedPartners)

      toast({
        title: "상대방 정보 저장 완료",
        description: `${partnerName}님의 정보가 저장되었습니다.`,
      })
    } else {
      toast({
        title: "저장 실패",
        description: "상대방 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 저장된 상대방 정보 선택 핸들러
  const handleSelectPartner = (partner: PartnerInfo) => {
    setPartnerName(partner.name)
    setPartnerGender(partner.gender)
    setPartnerYear(partner.year.toString())
    setPartnerMonth(partner.month.toString().padStart(2, "0"))
    setPartnerDay(partner.day.toString().padStart(2, "0"))

    if (partner.timeUnknown) {
      setPartnerTimeUnknown(true)
      setPartnerTime("")
    } else if (partner.hour !== null) {
      setPartnerTimeUnknown(false)
      setPartnerTime(`${partner.hour.toString().padStart(2, "0")}:${(partner.minute || 0).toString().padStart(2, "0")}`)
    }

    if (partner.relationshipStatus) {
      setPartnerRelationshipStatus(partner.relationshipStatus)
    }

    setShowSavedPartners(false)

    toast({
      title: "상대방 정보 불러오기 완료",
      description: `${partner.name}님의 정보가 입력되었습니다.`,
    })
  }

  // 저장된 상대방 정보 삭제 핸들러
  const handleDeletePartner = (partnerId: string, partnerName: string, e: React.MouseEvent) => {
    e.stopPropagation() // 클릭 이벤트 전파 방지

    const success = deletePartnerInfo(partnerId)

    if (success) {
      // 저장된 상대방 목록 업데이트
      const updatedPartners = getSavedPartners()
      setSavedPartners(updatedPartners)

      toast({
        title: "상대방 정보 삭제 완료",
        description: `${partnerName}님의 정보가 삭제되었습니다.`,
      })
    } else {
      toast({
        title: "삭제 실패",
        description: "상대방 정보 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 궁합 분석 제출 핸들러
  const handleCompatibilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!partnerName || !partnerYear || !partnerMonth || !partnerDay) {
      setCompatibilityError("이름과 생년월일은 필수 입력 항목입니다.")
      return
    }

    setIsAnalyzingCompatibility(true)
    setCompatibilityError(null)
    setCompatibilityResult(null)
    setPartnerSaju(null)

    try {
      // 파트너의 시간 정보 처리
      let partnerHour = 0
      let partnerMinute = 0

      if (!partnerTimeUnknown && partnerTime) {
        // 시간 입력값 파싱
        if (partnerTime.includes(":")) {
          const [hourStr, minuteStr] = partnerTime.split(":")
          partnerHour = Number.parseInt(hourStr, 10)
          partnerMinute = Number.parseInt(minuteStr, 10)
        } else if (partnerTime.length === 4) {
          partnerHour = Number.parseInt(partnerTime.substring(0, 2), 10)
          partnerMinute = Number.parseInt(partnerTime.substring(2), 10)
        } else {
          partnerHour = Number.parseInt(partnerTime, 10)
          partnerMinute = 0
        }
      }

      // 파트너 정보 객체 생성
      const partnerInfo = {
        name: partnerName,
        gender: partnerGender,
        year: Number.parseInt(partnerYear),
        month: Number.parseInt(partnerMonth),
        day: Number.parseInt(partnerDay),
        hour: partnerTimeUnknown ? null : partnerHour,
        minute: partnerTimeUnknown ? null : partnerMinute,
        timeUnknown: partnerTimeUnknown,
      }

      // 사용자 정보 객체 생성
      const userInfo = {
        name: name,
        gender: gender,
        saju: saju,
        relationshipStatus: relationshipStatus,
      }

      // 궁합 분석 API 호출
      const result = await getCompatibilityAnalysis(userInfo, partnerInfo, model, partnerRelationshipStatus)

      if (result && result.interpretation) {
        setCompatibilityResult(result.interpretation)

        // 파트너의 사주 정보 저장
        if (result.partnerSaju) {
          setPartnerSaju(result.partnerSaju)
        }

        // 궁합 결과 저장
        saveCompatibilityResultToLocalStorage({
          userInfo: {
            name: name,
            gender: gender,
            saju: saju,
          },
          partnerInfo: {
            name: partnerName,
            gender: partnerGender,
            year: Number.parseInt(partnerYear),
            month: Number.parseInt(partnerMonth),
            day: Number.parseInt(partnerDay),
            hour: partnerTimeUnknown ? null : partnerHour,
            minute: partnerTimeUnknown ? null : partnerMinute,
            timeUnknown: partnerTimeUnknown,
          },
          result: result.interpretation,
          partnerSaju: result.partnerSaju,
          model: model,
          compatibilityScore: result.compatibilityScore || 70, // 궁합 점수 추가
        })

        // 상대방 정보 자동 저장
        savePartnerInfo({
          name: partnerName,
          gender: partnerGender,
          year: Number.parseInt(partnerYear),
          month: Number.parseInt(partnerMonth),
          day: Number.parseInt(partnerDay),
          hour: partnerTimeUnknown ? null : partnerHour,
          minute: partnerTimeUnknown ? null : partnerMinute,
          timeUnknown: partnerTimeUnknown,
          relationshipStatus: partnerRelationshipStatus,
        })

        // 저장된 상대방 목록 업데이트
        const updatedPartners = getSavedPartners()
        setSavedPartners(updatedPartners)
      } else {
        throw new Error("궁합 분석 결과를 받지 못했습니다.")
      }
    } catch (error) {
      console.error("Error analyzing compatibility:", error)
      setCompatibilityError(error instanceof Error ? error.message : "궁합 분석 중 오류가 발생했습니다.")
    } finally {
      setIsAnalyzingCompatibility(false)
    }
  }

  // 관계 상태에 따라 다른 카테고리를 보여주는 함수
  const getCategoriesByRelationshipStatus = () => {
    // 사용자의 일주 추출
    const userIlju = `${dayStem}${dayBranch}`

    // 모든 관계 상태에 공통으로 추가할 연애운 상세 분석 카테고리
    const loveAnalysisCategory = {
      id: "love-detailed-analysis",
      title: `${userIlju}일주 연애운 상세 분석`,
      description: "사주를 통해 연애 성향, 궁합, 운명적 인연에 대한 상세 분석을 알아보세요.",
    }

    switch (relationshipStatus) {
      case "solo":
        return [
          loveAnalysisCategory, // 연애운 상세 분석 카테고리 추가
          {
            id: "solo-analysis",
            title: `${userIlju}일주 ${gender === "male" ? "남자" : "여자"} 솔로 원인분석`,
            description: "사주를 통해 솔로인 원인과 개선 방법을 알아보세요.",
          },
          {
            id: "dating-strategy",
            title: "사주를 활용한 연애 전략",
            description: "사주를 통해 연애를 성공적으로 이끌어갈 수 있는 전략을 알아보세요.",
          },
        ]
      case "flirting":
        return [
          loveAnalysisCategory, // 연애운 상세 분석 카테고리 추가
          {
            id: "flirting-strategy",
            title: `${userIlju}일주 썸 발전 전략`,
            description: "현재 썸 타는 관계를 연애로 발전시키기 위한 전략을 알아보세요.",
          },
          {
            id: "dating-strategy",
            title: "사주를 활용한 연애 전략",
            description: "사주를 통해 연애를 성공적으로 이끌어갈 수 있는 전략을 알아보세요.",
          },
        ]
      case "dating":
        return [
          loveAnalysisCategory, // 연애운 상세 분석 카테고리 추가
          {
            id: "relationship-issues",
            title: `${userIlju}일주 연애 문제 해결책`,
            description: "연애 중 겪을 수 있는 문제와 해결 방법에 대한 사주 해석을 확인하세요.",
          },
          {
            id: "dating-strategy",
            title: "사주를 활용한 연애 전략",
            description: "사주를 통해 연애를 성공적으로 이끌어갈 수 있는 전략을 알아보세요.",
          },
        ]
      case "married":
        return [
          loveAnalysisCategory, // 연애운 상세 분석 카테고리 추가
          {
            id: "marriage-issues",
            title: `${userIlju}일주 결혼생활 문제 해결책`,
            description: "결혼 생활에서 겪을 수 있는 문제와 해결 방법에 대한 사주 해석을 확인하세요.",
          },
          {
            id: "marriage-strategy",
            title: `${userIlju}일주 결혼생활 전략`,
            description: "사주를 통해 결혼생활을 행복하게 이끌어갈 수 있는 전략을 알아보세요.",
          },
        ]
      default:
        return [
          loveAnalysisCategory, // 연애운 상세 분석 카테고리 추가
          {
            id: "relationship-issues",
            title: "연애에서의 문제 & 해결책",
            description: "연애 중 겪을 수 있는 문제와 해결 방법에 대한 사주 해석을 확인하세요.",
          },
          {
            id: "dating-strategy",
            title: "사주를 활용한 연애 전략",
            description: "사주를 통해 연애를 성공적으로 이끌어갈 수 있는 전략을 알아보세요.",
          },
        ]
    }
  }

  // 카테고리 정보 가져오기
  const categories = getCategoriesByRelationshipStatus()

  // 사용자 정의 질문 목록
  const customQuestions = Object.keys(interpretations)
    .filter((key) => key.startsWith("custom:"))
    .map((key) => ({
      id: key,
      question: key.split("custom:")[1],
      answer: interpretations[key],
    }))

  // 모바일 페이지네이션을 위한 컨텐츠 분할
  const allContent = [
    {
      id: "compatibility",
      title: "궁합 분석",
      content: (
        <div className="w-full mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-0.5 shadow-lg">
            <button
              onClick={() => setShowCompatibilityForm(!showCompatibilityForm)}
              className={`w-full text-left rounded-2xl px-4 py-3 transition-all 
       ${showCompatibilityForm ? "bg-transparent text-white" : "bg-background hover:bg-background/90"}
       flex items-start gap-3 relative overflow-visible group`}
            >
              <div
                className={`flex items-center justify-center rounded-full p-2 
       ${showCompatibilityForm ? "bg-white/20 text-white" : "bg-pink-100 text-pink-600"} flex-shrink-0`}
              >
                <Users className="h-5 w-5" />
              </div>

              <div className="flex flex-col overflow-hidden">
                <span className={`font-medium text-base truncate ${showCompatibilityForm ? "text-white" : ""}`}>
                  다른 사람과의 궁합 알아보기
                </span>
                <span
                  className={`text-xs mt-1 line-clamp-2 
         ${showCompatibilityForm ? "text-white/80" : "text-muted-foreground"}`}
                >
                  특정 사람과의 궁합을 분석하고 상세한 해석을 받아보세요.
                </span>
              </div>
            </button>
          </div>

          {showCompatibilityForm && (
            <div className="mt-4 mb-6">
              <div className="bg-white dark:bg-gray-950 rounded-xl sm:rounded-2xl shadow-sm sm:border sm:border-pink-100 p-4 sm:p-6">
                <h3 className="font-medium text-xl mb-4 text-center">궁합 분석</h3>

                {!compatibilityResult ? (
                  <form onSubmit={handleCompatibilitySubmit} className="space-y-5">
                    <div className="space-y-4">
                      <div className="mb-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSavedPartners(!showSavedPartners)}
                          className="flex items-center justify-center gap-1 w-full sm:w-auto"
                        >
                          <UserPlus className="h-4 w-4" />
                          저장된 상대방
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </div>

                      {/* 저장된 상대방 목록 */}
                      {showSavedPartners && savedPartners.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 mb-3 max-h-48 overflow-y-auto">
                          <p className="text-xs text-muted-foreground mb-2">저장된 상대방 목록</p>
                          <div className="space-y-1">
                            {savedPartners.map((partner) => (
                              <div
                                key={partner.id}
                                className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                onClick={() => handleSelectPartner(partner)}
                              >
                                <div>
                                  <p className="text-sm font-medium">{partner.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {partner.gender === "male" ? "남성" : "여성"} | {partner.year}년 {partner.month}월{" "}
                                    {partner.day}일
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => handleDeletePartner(partner.id!, partner.name, e)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="partnerName" className="text-base">
                          상대방 이름
                        </Label>
                        <Input
                          id="partnerName"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="상대방 이름을 입력하세요"
                          className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base">상대방 성별</Label>
                        <RadioGroup value={partnerGender} onValueChange={setPartnerGender} className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="partner-male" className="text-pink-500" />
                            <Label htmlFor="partner-male" className="cursor-pointer">
                              남성
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="partner-female" className="text-pink-500" />
                            <Label htmlFor="partner-female" className="cursor-pointer">
                              여성
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base">상대방 생년월일</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={partnerYear} onValueChange={setPartnerYear}>
                            <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                              <SelectValue placeholder="연도" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>
                                  {y}년
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={partnerMonth} onValueChange={setPartnerMonth}>
                            <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                              <SelectValue placeholder="월" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {Number.parseInt(m)}월
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={partnerDay} onValueChange={setPartnerDay}>
                            <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                              <SelectValue placeholder="일" />
                            </SelectTrigger>
                            <SelectContent>
                              {days.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {Number.parseInt(d)}일
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="partnerTime"
                            className={`text-base ${partnerTimeUnknown ? "text-muted-foreground" : ""}`}
                          >
                            상대방 태어난 시간
                          </Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="timeUnknown"
                              checked={partnerTimeUnknown}
                              onChange={(e) => setPartnerTimeUnknown(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-pink-500"
                            />
                            <Label htmlFor="timeUnknown" className="text-sm font-normal cursor-pointer">
                              시간 모름
                            </Label>
                          </div>
                        </div>
                        <Input
                          id="partnerTime"
                          value={partnerTime}
                          onChange={(e) => setPartnerTime(e.target.value)}
                          placeholder="2330 또는 23:30 형식으로 입력"
                          disabled={partnerTimeUnknown}
                          className={`border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800 ${partnerTimeUnknown ? "bg-muted" : ""}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          24시간 형식으로 입력하세요. 예) 오후 11시 30분 {"->"} 2330 또는 23:30
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label className="text-base">현재 관계 상태</Label>
                      <Select value={partnerRelationshipStatus} onValueChange={setPartnerRelationshipStatus}>
                        <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                          <SelectValue placeholder="관계 상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">선택 안함</SelectItem>
                          <SelectItem value="solo">솔로 (처음 만남)</SelectItem>
                          <SelectItem value="flirting">썸 타는 중</SelectItem>
                          <SelectItem value="dating">연애 중</SelectItem>
                          <SelectItem value="married">결혼 중</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        현재 관계 상태에 맞는 맞춤형 궁합 분석을 제공합니다.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white dark:text-white"
                      disabled={isAnalyzingCompatibility}
                      size="lg"
                    >
                      {isAnalyzingCompatibility ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          궁합 분석 중...
                        </>
                      ) : (
                        "궁합 분석하기"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* 사주 비교 표시 */}
                    {partnerSaju && (
                      <CompatibilityComparison
                        userSaju={saju}
                        partnerSaju={partnerSaju}
                        userName={name || "나"}
                        partnerName={partnerName}
                      />
                    )}

                    <CompatibilityResultCardComponent
                      result={compatibilityResult}
                      onReset={() => {
                        setCompatibilityResult(null)
                        setPartnerSaju(null)
                      }}
                    />
                  </div>
                )}

                {compatibilityError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{compatibilityError}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "questions",
      title: "추가 질문",
      content: (
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="w-full">
              <button
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full text-left rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all shadow-sm hover:shadow 
               ${
                 activeCategories.includes(category.id)
                   ? "bg-primary/90 text-white"
                   : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
               }
               flex items-start gap-3 relative overflow-visible group`}
              >
                <div
                  className={`flex items-center justify-center rounded-full p-2 
               ${
                 activeCategories.includes(category.id)
                   ? "bg-white/20"
                   : "bg-primary/10 text-primary dark:bg-primary/20"
               } flex-shrink-0`}
                >
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-base truncate">{category.title}</span>
                  <span
                    className={`text-xs mt-1 line-clamp-2 
                 ${activeCategories.includes(category.id) ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    {category.description}
                  </span>
                </div>
              </button>

              {activeCategories.includes(category.id) && (
                <div className="mt-2 mb-4 bg-white dark:bg-gray-950 rounded-xl p-2 sm:p-4">
                  {loadingCategory === category.id ? (
                    <div className="flex flex-col items-center justify-center py-5 sm:py-8 space-y-3 sm:space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="text-center space-y-2">
                        <p className="font-medium text-primary">{loadingStage}</p>
                        <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                      </div>

                      <div className="w-full max-w-xs mt-2">
                        <Progress value={loadingProgress} className="h-1.5" />
                        <p className="text-xs text-center mt-1 text-muted-foreground">{loadingProgress}% 완료</p>
                      </div>
                    </div>
                  ) : errors[category.id] ? (
                    <div className="text-red-500 text-sm">
                      <p>오류가 발생했습니다: {errors[category.id]}</p>
                      <p className="mt-2">다시 시도해주세요.</p>
                    </div>
                  ) : interpretations[category.id] ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{interpretations[category.id] || ""}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">해석을 불러올 수 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "custom",
      title: "나만의 질문",
      content: (
        <div className="space-y-4">
          {/* 나만의 추가 질문 버튼 */}
          <div className="w-full">
            {!showCustomInput ? (
              <button
                onClick={() => {
                  setShowCustomInput(true)
                  setTimeout(() => customInputRef.current?.focus(), 100)
                }}
                className="w-full text-left rounded-2xl px-4 py-3 transition-all shadow hover:shadow-md 
               bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
               flex items-start gap-3 relative overflow-visible group"
              >
                <div
                  className="flex items-center justify-center rounded-full p-2 
               bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0"
                >
                  <PlusCircle className="h-5 w-5" />
                </div>

                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-base truncate">나만의 추가 질문하기</span>
                  <span className="text-xs mt-1 line-clamp-2 text-muted-foreground">
                    궁금한 내용을 직접 질문하고 사주 기반 답변을 받아보세요.
                  </span>
                </div>
              </button>
            ) : (
              <Card className="p-2 shadow-md">
                <div className="flex items-center gap-2">
                  <Input
                    ref={customInputRef}
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="궁금한 내용을 질문해보세요..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleCustomQuestionSubmit()
                      }
                    }}
                    disabled={loadingCategory !== null}
                  />
                  <Button
                    onClick={handleCustomQuestionSubmit}
                    disabled={!customQuestion.trim() || loadingCategory !== null}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowCustomInput(false)}
                    variant="outline"
                    size="icon"
                    disabled={loadingCategory !== null && loadingCategory.startsWith("custom:")}
                  >
                    ✕
                  </Button>
                </div>
                {loadingCategory && loadingCategory.startsWith("custom:") && (
                  <div className="mt-2 text-center">
                    <p className="text-xs text-primary font-medium">질문 분석 중...</p>
                    <Progress value={loadingProgress} className="h-1 mt-1" />
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* 사용자 정의 질문 결과 표시 */}
          {customQuestions.map(
            (item) =>
              activeCategories.includes(item.id) && (
                <div key={item.id} className="w-full">
                  <div className="bg-primary/90 text-white rounded-xl sm:rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center rounded-full p-2 bg-white/20 flex-shrink-0">
                        <MessageCircle className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-base">나의 질문</span>
                        <span className="text-sm mt-1 text-white/80">{item.question}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 mb-4 bg-white dark:bg-gray-950 rounded-xl p-2 sm:p-4">
                    {loadingCategory === item.id ? (
                      <div className="flex flex-col items-center justify-center py-5 sm:py-8 space-y-3 sm:space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div className="text-center space-y-2">
                          <p className="font-medium text-primary">{loadingStage}</p>
                          <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                        </div>

                        <div className="w-full max-w-xs mt-2">
                          <Progress value={loadingProgress} className="h-1.5" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">{loadingProgress}% 완료</p>
                        </div>
                      </div>
                    ) : errors[item.id] ? (
                      <div className="text-red-500 text-sm">
                        <p>오류가 발생했습니다: {errors[item.id]}</p>
                        <p className="mt-2">다시 시도해주세요.</p>
                      </div>
                    ) : item.answer ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{item.answer || ""}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">해석을 불러올 수 없습니다.</p>
                    )}
                  </div>
                </div>
              ),
          )}
        </div>
      ),
    },
  ]

  // 현재 페이지에 해당하는 컨텐츠 가져오기
  const currentContent = allContent[currentPage - 1] || allContent[0]

  // 모바일 페이지네이션 렌더링
  const renderMobilePagination = () => (
    <div className="sm:hidden">
      <div className="mb-4">
        <h3 className="font-medium text-lg">추가 질문</h3>
        <p className="text-sm text-muted-foreground">
          더 자세한 사주 해석이 필요하신가요? 아래 버튼을 클릭하여 추가 질문에 대한 해석을 확인하세요.
        </p>
      </div>

      {/* 채팅 시작 버튼 추가 - 모바일에서 상단에 배치 */}
      <div className="mb-6">
        <Button
          onClick={() => {
            // 채팅 목록 페이지로 이동
            const params = new URLSearchParams({
              saju: JSON.stringify(saju),
              name,
              gender,
              interpretation,
              returnPath: window.location.pathname + window.location.search,
            }).toString()
            router.push(`/chat-list?${params}`)
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          size="lg"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          사주 채팅 상담 시작하기
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          AI와 1:1 대화를 통해 더 자세한 사주 해석을 받아보세요
        </p>
      </div>

      <div className="mb-4">
        <Pagination className="w-full">
          <PaginationContent className="w-full grid grid-cols-3 gap-1">
            {allContent.map((content, index) => (
              <PaginationItem key={content.id} className="w-full">
                <PaginationLink
                  isActive={currentPage === index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className="w-full justify-center text-center"
                >
                  {content.title}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      </div>

      <div className="mt-4">
        <h4 className="font-medium text-base mb-3">{currentContent.title}</h4>
        {currentContent.content}
      </div>
    </div>
  )

  // 데스크톱 뷰 렌더링
  const renderDesktopView = () => (
    <div className="hidden sm:block space-y-4">
      <h3 className="font-medium text-lg">추가 질문</h3>
      <p className="text-sm text-muted-foreground">
        더 자세한 사주 해석이 필요하신가요? 아래 버튼을 클릭하여 추가 질문에 대한 해석을 확인하세요.
      </p>

      {/* 채팅 시작 버튼 추가 - 데스크톱에서 상단에 배치 */}
      <div className="mb-6">
        <Button
          onClick={() => {
            // 채팅 목록 페이지로 이동
            const params = new URLSearchParams({
              saju: JSON.stringify(saju),
              name,
              gender,
              interpretation,
              returnPath: window.location.pathname + window.location.search,
            }).toString()
            router.push(`/chat-list?${params}`)
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          size="lg"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          사주 채팅 상담 시작하기
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          AI와 1:1 대화를 통해 더 자세한 사주 해석을 받아보세요
        </p>
      </div>

      {/* 다른 사람과의 궁합 알아보기 버튼 */}
      <div className="w-full mb-6">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-0.5 shadow-lg">
          <button
            onClick={() => setShowCompatibilityForm(!showCompatibilityForm)}
            className={`w-full text-left rounded-2xl px-4 py-3 transition-all 
       ${showCompatibilityForm ? "bg-transparent text-white" : "bg-background hover:bg-background/90"}
       flex items-start gap-3 relative overflow-visible group`}
          >
            <div
              className={`flex items-center justify-center rounded-full p-2 
       ${showCompatibilityForm ? "bg-white/20 text-white" : "bg-pink-100 text-pink-600"} flex-shrink-0`}
            >
              <Users className="h-5 w-5" />
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className={`font-medium text-base truncate ${showCompatibilityForm ? "text-white" : ""}`}>
                다른 사람과의 궁합 알아보기
              </span>
              <span
                className={`text-xs mt-1 line-clamp-2 
         ${showCompatibilityForm ? "text-white/80" : "text-muted-foreground"}`}
              >
                특정 사람과의 궁합을 분석하고 상세한 해석을 받아보세요.
              </span>
            </div>
          </button>
        </div>

        {showCompatibilityForm && (
          <div className="mt-4 mb-6">
            <div className="bg-white dark:bg-gray-950 rounded-xl sm:rounded-2xl shadow-sm sm:border sm:border-pink-100 p-4 sm:p-6">
              <h3 className="font-medium text-xl mb-4 text-center">궁합 분석</h3>

              {!compatibilityResult ? (
                <form onSubmit={handleCompatibilitySubmit} className="space-y-5">
                  <div className="space-y-4">
                    <div className="mb-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSavedPartners(!showSavedPartners)}
                        className="flex items-center justify-center gap-1 w-full sm:w-auto"
                      >
                        <UserPlus className="h-4 w-4" />
                        저장된 상대방
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    {/* 저장된 상대방 목록 */}
                    {showSavedPartners && savedPartners.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 mb-3 max-h-48 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">저장된 상대방 목록</p>
                        <div className="space-y-1">
                          {savedPartners.map((partner) => (
                            <div
                              key={partner.id}
                              className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                              onClick={() => handleSelectPartner(partner)}
                            >
                              <div>
                                <p className="text-sm font-medium">{partner.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {partner.gender === "male" ? "남성" : "여성"} | {partner.year}년 {partner.month}월{" "}
                                  {partner.day}일
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => handleDeletePartner(partner.id!, partner.name, e)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="partnerName" className="text-base">
                        상대방 이름
                      </Label>
                      <Input
                        id="partnerName"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="상대방 이름을 입력하세요"
                        className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">상대방 성별</Label>
                      <RadioGroup value={partnerGender} onValueChange={setPartnerGender} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="partner-male" className="text-pink-500" />
                          <Label htmlFor="partner-male" className="cursor-pointer">
                            남성
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="partner-female" className="text-pink-500" />
                          <Label htmlFor="partner-female" className="cursor-pointer">
                            여성
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">상대방 생년월일</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={partnerYear} onValueChange={setPartnerYear}>
                          <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                            <SelectValue placeholder="연도" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}년
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={partnerMonth} onValueChange={setPartnerMonth}>
                          <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                            <SelectValue placeholder="월" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m} value={m}>
                                {Number.parseInt(m)}월
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={partnerDay} onValueChange={setPartnerDay}>
                          <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                            <SelectValue placeholder="일" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((d) => (
                              <SelectItem key={d} value={d}>
                                {Number.parseInt(d)}일
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="partnerTime"
                          className={`text-base ${partnerTimeUnknown ? "text-muted-foreground" : ""}`}
                        >
                          상대방 태어난 시간
                        </Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="timeUnknown"
                            checked={partnerTimeUnknown}
                            onChange={(e) => setPartnerTimeUnknown(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-pink-500"
                          />
                          <Label htmlFor="timeUnknown" className="text-sm font-normal cursor-pointer">
                            시간 모름
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="partnerTime"
                        value={partnerTime}
                        onChange={(e) => setPartnerTime(e.target.value)}
                        placeholder="2330 또는 23:30 형식으로 입력"
                        disabled={partnerTimeUnknown}
                        className={`border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800 ${partnerTimeUnknown ? "bg-muted" : ""}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        24시간 형식으로 입력하세요. 예) 오후 11시 30분 {"->"} 2330 또는 23:30
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label className="text-base">현재 관계 상태</Label>
                    <Select value={partnerRelationshipStatus} onValueChange={setPartnerRelationshipStatus}>
                      <SelectTrigger className="border-pink-100 focus-visible:ring-pink-500 dark:border-pink-800">
                        <SelectValue placeholder="관계 상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">선택 안함</SelectItem>
                        <SelectItem value="solo">솔로 (처음 만남)</SelectItem>
                        <SelectItem value="flirting">썸 타는 중</SelectItem>
                        <SelectItem value="dating">연애 중</SelectItem>
                        <SelectItem value="married">결혼 중</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      현재 관계 상태에 맞는 맞춤형 궁합 분석을 제공합니다.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white dark:text-white"
                    disabled={isAnalyzingCompatibility}
                    size="lg"
                  >
                    {isAnalyzingCompatibility ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        궁합 분석 중...
                      </>
                    ) : (
                      "궁합 분석하기"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* 사주 비교 표시 */}
                  {partnerSaju && (
                    <CompatibilityComparison
                      userSaju={saju}
                      partnerSaju={partnerSaju}
                      userName={name || "나"}
                      partnerName={partnerName}
                    />
                  )}

                  <CompatibilityResultCardComponent
                    result={compatibilityResult}
                    onReset={() => {
                      setCompatibilityResult(null)
                      setPartnerSaju(null)
                    }}
                  />
                </div>
              )}

              {compatibilityError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{compatibilityError}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="w-full">
            <button
              onClick={() => handleCategoryClick(category.id)}
              className={`w-full text-left rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all shadow-sm hover:shadow 
               ${
                 activeCategories.includes(category.id)
                   ? "bg-primary/90 text-white"
                   : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
               }
               flex items-start gap-3 relative overflow-visible group`}
            >
              <div
                className={`flex items-center justify-center rounded-full p-2 
               ${
                 activeCategories.includes(category.id)
                   ? "bg-white/20"
                   : "bg-primary/10 text-primary dark:bg-primary/20"
               } flex-shrink-0`}
              >
                <MessageCircle className="h-5 w-5" />
              </div>

              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-base truncate">{category.title}</span>
                <span
                  className={`text-xs mt-1 line-clamp-2 
                 ${activeCategories.includes(category.id) ? "text-white/80" : "text-muted-foreground"}`}
                >
                  {category.description}
                </span>
              </div>
            </button>

            {activeCategories.includes(category.id) && (
              <div className="mt-2 mb-4 bg-white dark:bg-gray-950 rounded-xl p-2 sm:p-4">
                {loadingCategory === category.id ? (
                  <div className="flex flex-col items-center justify-center py-5 sm:py-8 space-y-3 sm:space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center space-y-2">
                      <p className="font-medium text-primary">{loadingStage}</p>
                      <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                    </div>

                    <div className="w-full max-w-xs mt-2">
                      <Progress value={loadingProgress} className="h-1.5" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">{loadingProgress}% 완료</p>
                    </div>
                  </div>
                ) : errors[category.id] ? (
                  <div className="text-red-500 text-sm">
                    <p>오류가 발생했습니다: {errors[category.id]}</p>
                    <p className="mt-2">다시 시도해주세요.</p>
                  </div>
                ) : interpretations[category.id] ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{interpretations[category.id] || ""}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">해석을 불러올 수 없습니다.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 나만의 추가 질문 버튼 */}
        <div className="w-full">
          {!showCustomInput ? (
            <button
              onClick={() => {
                setShowCustomInput(true)
                setTimeout(() => customInputRef.current?.focus(), 100)
              }}
              className="w-full text-left rounded-2xl px-4 py-3 transition-all shadow hover:shadow-md 
               bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
               flex items-start gap-3 relative overflow-visible group"
            >
              <div
                className="flex items-center justify-center rounded-full p-2 
               bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0"
              >
                <PlusCircle className="h-5 w-5" />
              </div>

              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-base truncate">나만의 추가 질문하기</span>
                <span className="text-xs mt-1 line-clamp-2 text-muted-foreground">
                  궁금한 내용을 직접 질문하고 사주 기반 답변을 받아보세요.
                </span>
              </div>
            </button>
          ) : (
            <Card className="p-2 shadow-md">
              <div className="flex items-center gap-2">
                <Input
                  ref={customInputRef}
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="궁금한 내용을 질문해보세요..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleCustomQuestionSubmit()
                    }
                  }}
                />
                <Button
                  onClick={handleCustomQuestionSubmit}
                  disabled={!customQuestion.trim() || loadingCategory !== null}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowCustomInput(false)} variant="outline" size="icon">
                  ✕
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* 사용자 정의 질문 결과 표시 */}
        {customQuestions.map(
          (item) =>
            activeCategories.includes(item.id) && (
              <div key={item.id} className="w-full">
                <div className="bg-primary/90 text-white rounded-xl sm:rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center rounded-full p-2 bg-white/20 flex-shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </div>

                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-base">나의 질문</span>
                      <span className="text-sm mt-1 text-white/80">{item.question}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 mb-4 bg-white dark:bg-gray-950 rounded-xl p-2 sm:p-4">
                  {loadingCategory === item.id ? (
                    <div className="flex flex-col items-center justify-center py-5 sm:py-8 space-y-3 sm:space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="text-center space-y-2">
                        <p className="font-medium text-primary">{loadingStage}</p>
                        <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                      </div>

                      <div className="w-full max-w-xs mt-2">
                        <Progress value={loadingProgress} className="h-1.5" />
                        <p className="text-xs text-center mt-1 text-muted-foreground">{loadingProgress}% 완료</p>
                      </div>
                    </div>
                  ) : errors[item.id] ? (
                    <div className="text-red-500 text-sm">
                      <p>오류가 발생했습니다: {errors[item.id]}</p>
                      <p className="mt-2">다시 시도해주세요.</p>
                    </div>
                  ) : item.answer ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{item.answer || ""}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">해석을 불러올 수 없습니다.</p>
                  )}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  )

  // 채팅 페이지로 이동하는 함수
  const handleChatStart = () => {
    // 현재 URL을 returnPath로 사용
    const currentPath = window.location.pathname + window.location.search

    const chatParams = new URLSearchParams()
    chatParams.set("saju", JSON.stringify(saju))
    chatParams.set("name", name)
    chatParams.set("gender", gender)
    chatParams.set("interpretation", interpretation)
    chatParams.set("returnPath", currentPath)

    router.push(`/chat?${chatParams.toString()}`)
  }

  return <>{isMobile ? renderMobilePagination() : renderDesktopView()}</>
}
