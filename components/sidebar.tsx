"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, Trash2, Calendar, User, Settings, LogOut, Home, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { createChatRoom, getChatRooms, deleteChatRoom } from "@/lib/chat-room-service"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { SignInModal } from "./signin-modal"

interface ChatRoom {
  id: string
  name: string
  created_at: string
  updated_at: string
  message_count?: number
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)

  // Load chat rooms when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadChatRooms()
    } else {
      setChatRooms([])
    }
  }, [isAuthenticated])

  const loadChatRooms = async () => {
    try {
      setIsLoading(true)
      const rooms = await getChatRooms()
      setChatRooms(rooms || [])
    } catch (error) {
      console.error("Error loading chat rooms:", error)
      toast({
        title: "채팅방 목록 로드 실패",
        description: "채팅방 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowSignInModal(true)
      return
    }

    try {
      setIsLoading(true)
      const newRoom = await createChatRoom("새로운 대화")

      if (newRoom) {
        // Refresh chat rooms list
        await loadChatRooms()

        // Navigate to the new chat room
        router.push(`/saju-chat/${newRoom.id}`)

        toast({
          title: "새 대화 생성",
          description: "새로운 대화방이 생성되었습니다.",
        })
      }
    } catch (error) {
      console.error("❌ Error creating new chat:", error)
      toast({
        title: "새 대화 생성 실패",
        description: "새로운 대화를 생성하는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("이 대화를 삭제하시겠습니까?")) {
      return
    }

    try {
      await deleteChatRoom(roomId)
      await loadChatRooms()

      // If we're currently in the deleted room, navigate away
      if (pathname.includes(roomId)) {
        router.push("/chat-list")
      }

      toast({
        title: "대화 삭제",
        description: "대화가 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error deleting chat room:", error)
      toast({
        title: "삭제 실패",
        description: "대화 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleChatClick = (roomId: string) => {
    router.push(`/saju-chat/${roomId}`)
  }

  const handleAuthSuccess = async () => {
    setShowSignInModal(false)
    // After successful login, try creating new chat again
    await handleNewChat()
  }

  const handleLogout = async () => {
    try {
      await logout()
      setChatRooms([])
      router.push("/")
      toast({
        title: "로그아웃",
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

  const navigationItems = [
    {
      label: "홈",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "마이페이지",
      icon: User,
      href: "/mypage",
      active: pathname === "/mypage",
    },
    {
      label: "대운 분석",
      icon: Calendar,
      href: "/daeun-analysis",
      active: pathname === "/daeun-analysis",
    },
    {
      label: "오늘의 운세",
      icon: Sparkles,
      href: "/daily-fortune",
      active: pathname === "/daily-fortune",
    },
  ]

  return (
    <>
      <div className={cn("flex flex-col h-full bg-background border-r", className)}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">사주핑</h2>
            {isAuthenticated && (
              <Button onClick={handleNewChat} size="sm" disabled={isLoading} className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!isAuthenticated && (
            <Button onClick={() => setShowSignInModal(true)} className="w-full" size="sm">
              로그인
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={item.active ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Chat Rooms */}
        {isAuthenticated && (
          <div className="flex-1 flex flex-col">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">대화 목록</h3>
                <Badge variant="secondary" className="text-xs">
                  {chatRooms.length}
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="space-y-1 pb-4">
                {isLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-4">로딩 중...</div>
                ) : chatRooms.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">아직 대화가 없습니다</div>
                ) : (
                  chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className={cn(
                        "group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-accent",
                        pathname.includes(room.id) && "bg-accent",
                      )}
                      onClick={() => handleChatClick(room.id)}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(room.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteChat(room.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        {isAuthenticated && (
          <>
            <Separator />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.email || "사용자"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title="로그인이 필요합니다"
        description="새 대화를 시작하려면 로그인해주세요"
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}
