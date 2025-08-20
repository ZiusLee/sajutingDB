"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User, LogOut, Bell, Shield, HelpCircle, ChevronRight, LogIn, Brain, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface SettingsDialogProps {
  children: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userCoins, setUserCoins] = useState({
    total: 0,
    subscription: 0,
    bonus: 0,
    plan: null,
  })
  const [loadingCoins, setLoadingCoins] = useState(false)

  const fetchCoins = async () => {
    if (!isAuthenticated || !user) return

    try {
      setLoadingCoins(true)
      const response = await fetch("/api/user-coins")
      if (response.ok) {
        const data = await response.json()
        setUserCoins({
          total: (data.subscription_coins || 0) + (data.bonus_coins || 0),
          subscription: data.subscription_coins || 0,
          bonus: data.bonus_coins || 0,
          plan: data.subscription_plan || null,
        })
      }
    } catch (error) {
      console.error("핑 갯수 조회 오류:", error)
    } finally {
      setLoadingCoins(false)
    }
  }

  useEffect(() => {
    if (open && isAuthenticated) {
      fetchCoins()
    }
  }, [open, isAuthenticated])

  const handleLogout = async () => {
    try {
      await logout()
      setOpen(false)
      router.push("/")
    } catch (error) {
      console.error("로그아웃 오류:", error)
    }
  }

  const handleLogin = () => {
    setOpen(false)
    router.push("/auth")
  }

  const handleMyPage = () => {
    setOpen(false)
    router.push("/mypage")
  }

  const handleMemoryBank = () => {
    setOpen(false)
    router.push("/memory-dashboard")
  }

  const handleChargeStation = () => {
    setOpen(false)
    router.push("/charge")
  }

  if (!isAuthenticated) {
    return (
      <Button variant="ghost" size="icon" onClick={handleLogin}>
        <LogIn className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-yellow-400 text-black font-semibold">
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{user?.user_metadata?.name || "사용자"}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleMyPage}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Account Section */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 px-4 mb-2">계정</p>

            <Button variant="ghost" className="w-full justify-start h-12 px-4" onClick={handleMyPage}>
              <User className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">내 정보</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 px-4" onClick={handleMemoryBank}>
              <Brain className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">메모리뱅크</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 px-4" onClick={handleChargeStation}>
              <Zap className="h-5 w-5 mr-3 text-yellow-500" />
              <span className="flex-1 text-left">정기결제</span>
              <div className="flex flex-col items-end gap-1 mr-2">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-black text-xs font-bold">P</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">
                    {loadingCoins ? "..." : `${userCoins.total}핑`}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  구독핑 {userCoins.subscription} + 보너스핑 {userCoins.bonus}
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 px-4" disabled>
              <Bell className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">알림 설정</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Information Section */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 px-4 mb-2">정보</p>

            <Button variant="ghost" className="w-full justify-start h-12 px-4" disabled>
              <HelpCircle className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">도움말 센터</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="w-full justify-start h-12 px-4" disabled>
              <Shield className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">개인정보 보호 정책</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="flex-1 text-left">로그아웃</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
