"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, UserPlus, Calendar, Clock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNavBar } from "@/components/bottom-nav-bar"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface User {
  id: string
  name: string
  gender: string
  birth_year: string
  birth_month: string
  birth_day: string
  birth_hour: string
  birth_minute: string
  time_unknown: boolean
  created_at: string
  profile_image_url?: string
  saju?: {
    year_stem: string
    year_branch: string
    month_stem: string
    month_branch: string
    day_stem: string
    day_branch: string
    hour_stem: string
    hour_branch: string
  }
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [hasSearched, setHasSearched] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // 검색 함수
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "검색어를 입력하세요",
        description: "이름이나 생년월일을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`)

      if (!response.ok) {
        throw new Error("사용자 검색에 실패했습니다.")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "검색 오류",
        description: "사용자 검색 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // 사용자 프로필로 이동
  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  // 필터링된 사용자 목록
  const filteredUsers =
    activeTab === "all"
      ? users
      : activeTab === "male"
        ? users.filter((user) => user.gender === "male")
        : users.filter((user) => user.gender === "female")

  return (
    <div className="container mx-auto py-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">사용자 검색</h1>

      {/* 검색 입력 */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="이름 또는 생년월일 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="male">남성</TabsTrigger>
          <TabsTrigger value="female">여성</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 검색 결과 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : hasSearched ? (
        filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateToProfile(user.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {user.gender === "male" ? "남성" : "여성"}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {user.birth_year}년 {user.birth_month}월 {user.birth_day}일
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{user.time_unknown ? "시간 미상" : `${user.birth_hour}시 ${user.birth_minute}분`}</span>
                        </div>
                      </div>
                      {user.saju && (
                        <div className="mt-2 text-xs">
                          <span className="text-primary font-medium">사주: </span>
                          {user.saju.year_stem}
                          {user.saju.year_branch} {user.saju.month_stem}
                          {user.saju.month_branch} {user.saju.day_stem}
                          {user.saju.day_branch} {user.saju.hour_stem}
                          {user.saju.hour_branch}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">이름이나 생년월일로 사용자를 검색해보세요.</p>
          </CardContent>
        </Card>
      )}

      {/* 하단 네비게이션 바 */}
      <BottomNavBar />
    </div>
  )
}
