"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Settings, Star } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { getUserSajuProfiles } from "@/lib/saju-session-service"

interface SajuProfile {
  id: string
  name: string
  gender: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string
  birthMinute: string
  saju: any
  createdAt: string
}

interface UserProfileDropdownProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  currentName: string
}

export default function UserProfileDropdown({ isOpen, onClose, onToggle, currentName }: UserProfileDropdownProps) {
  const [profiles, setProfiles] = useState<SajuProfile[]>([])
  const [mainProfile, setMainProfile] = useState<SajuProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadUserProfiles()
    }
  }, [isOpen])

  const loadUserProfiles = async () => {
    try {
      setLoading(true)
      const { profiles: userProfiles } = await getUserSajuProfiles()

      const formattedProfiles = userProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        birthYear: profile.birthYear,
        birthMonth: profile.birthMonth,
        birthDay: profile.birthDay,
        birthHour: profile.birthHour,
        birthMinute: profile.birthMinute,
        saju: profile.saju,
        createdAt: profile.createdAt,
      }))

      setProfiles(formattedProfiles)

      // 가장 최근 프로필을 대표 사주로 설정
      if (formattedProfiles.length > 0) {
        const mostRecent = formattedProfiles.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]
        setMainProfile(mostRecent)
      }
    } catch (error) {
      console.error("Error loading user profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
      onClose()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleMyPage = () => {
    router.push("/mypage")
    onClose()
  }

  const formatDate = (year: string, month: string, day: string) => {
    return `${year}년 ${month}월 ${day}일`
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="p-4">
        {/* 사용자 정보 헤더 */}
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">{currentName || "사���자"}님</div>
            <div className="text-sm text-gray-400">로그인됨</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-400">로딩 중...</div>
        ) : (
          <>
            {/* 대표 사주 */}
            {mainProfile && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-300">대표 사주</span>
                </div>
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{mainProfile.name}</div>
                        <div className="text-sm text-gray-400">
                          {formatDate(mainProfile.birthYear, mainProfile.birthMonth, mainProfile.birthDay)}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                        {mainProfile.gender === "male" ? "남" : "여"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 사주 히스토리 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">사주 히스토리</span>
                <span className="text-xs text-gray-500">{profiles.length}개</span>
              </div>

              {profiles.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {profiles.slice(0, 3).map((profile) => (
                    <div
                      key={profile.id}
                      className="p-2 bg-gray-700/30 rounded border border-gray-600/50 hover:bg-gray-600/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{profile.name}</div>
                          <div className="text-xs text-gray-400">
                            {formatDate(profile.birthYear, profile.birthMonth, profile.birthDay)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{profile.gender === "male" ? "남" : "여"}</div>
                      </div>
                    </div>
                  ))}
                  {profiles.length > 3 && (
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMyPage}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        +{profiles.length - 3}개 더보기
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 text-gray-500 text-sm">아직 사주 기록이 없습니다</div>
              )}
            </div>
          </>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-2 pt-3 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={handleMyPage}
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            마이페이지
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
