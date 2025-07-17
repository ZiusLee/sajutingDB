"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, LogOut, User, Bell, Shield, HelpCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      setOpen(false)
      router.push("/")
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
          <DialogDescription>앱 설정을 관리하고 계정 정보를 확인하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              계정
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                프로필 편집
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                비밀번호 변경
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notifications Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              알림
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">푸시 알림</span>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">다크 모드</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>

          <Separator />

          {/* Privacy Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              개인정보
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                개인정보 처리방침
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                이용약관
              </Button>
            </div>
          </div>

          <Separator />

          {/* Support Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              지원
            </h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                도움말
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                문의하기
              </Button>
            </div>
          </div>

          <Separator />

          {/* Logout */}
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
