"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Search, UserPlus, Users } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BottomNavBar } from "@/components/bottom-nav-bar"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    name?: string
  }
}

export default function SearchPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [recentSearches, setRecentSearches] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const supabase = createClientComponentClient()

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) {
        console.error("Error fetching current user:", error)
        return
      }
      if (user) {
        setCurrentUser(user as User)
      }
    }

    fetchCurrentUser()
    loadRecentSearches()
  }, [supabase])

  // 최근 검색 기록 로드
  const loadRecentSearches = () => {
    const savedSearches = localStorage.getItem("recentUserSearches")
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (error) {
        console.error("Error parsing recent searches:", error)
      }
    }
  }

  // 최근 검색 기록 저장
  const saveToRecentSearches = (user: User) => {
    const updatedSearches = [user, ...recentSearches.filter((item) => item.id !== user.id)].slice(0, 5)
    setRecentSearches(updatedSearches)
    localStorage.setItem("recentUserSearches", JSON.stringify(updatedSearches))
  }

  // 사용자 검색 함수
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "검색어를 입력하세요",
        description: "이름 또는 이메일을 입력하여 사용자를 검색하세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      // API 엔드포인트를 통해 사용자 검색
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      const users = data.users || []

      // 현재 사용자 제외
      const filteredUsers = users.filter((user: User) => user.id !== currentUser?.id)
      setSearchResults(filteredUsers)
      setAllUsers(filteredUsers)
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "사용자 검색 오류",
        description: "사용자를 검색하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 사용자 프로필로 이동
  const navigateToProfile = (user: User) => {
    saveToRecentSearches(user)
    router.push(`/profile/${user.id}`)
  }

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="container mx-auto pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">검색</h1>

        {/* 검색 입력 */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="이름 또는 이메일로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 검색 안내 메시지 (검색하기 전) */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h2 className="text-xl font-medium mb-2">사용자 검색</h2>
            <p className="text-muted-foreground mb-4">이름 또는 이메일을 입력하여 사용자를 검색하세요.</p>
          </div>
        )}

        {/* 검색 결과 */}
        {hasSearched && searchResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">검색 결과</h2>
            <div className="space-y-2">
              {searchResults.map((user) => (
                <Card
                  key={user.id}
                  className="p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => navigateToProfile(user)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>
                      {user.user_metadata?.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user.user_metadata?.name || "사용자"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 최근 검색 */}
        {recentSearches.length > 0 && !hasSearched && (
          <div>
            <h2 className="text-lg font-semibold mb-2">최근 검색</h2>
            <div className="space-y-2">
              {recentSearches.map((user) => (
                <Card
                  key={user.id}
                  className="p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => navigateToProfile(user)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>
                      {user.user_metadata?.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user.user_metadata?.name || "사용자"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {hasSearched && searchResults.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-muted-foreground">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* 로딩 중 */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-current rounded-full border-t-transparent mx-auto mb-2"></div>
            <p className="text-muted-foreground">사용자 정보를 불러오는 중...</p>
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  )
}
