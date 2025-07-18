"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, MessageSquare, ChevronUp, ChevronDown } from "lucide-react"
import SajuDiagram from "@/components/saju-diagram"
import DaeunDiagram from "@/components/daeun-diagram"
import { getChatRooms, createChatRoom, deleteChatRoom, type ChatRoom } from "@/lib/chat-room-service"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { BirthInfo } from "@/types/birth-date"

interface SidebarProps {
  saju: any
  name: string
  gender: string
  birthInfo?: BirthInfo
  calculatedDaeun: any
  sessionId: string
  roomType: string
  currentChatRoomId?: string
  onChatRoomSelect: (chatRoomId: string) => void
  onNewChat: () => void
}

export default function Sidebar({
  saju,
  name,
  gender,
  birthInfo,
  calculatedDaeun,
  sessionId,
  roomType,
  currentChatRoomId,
  onChatRoomSelect,
  onNewChat,
}: SidebarProps) {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loadingChatRooms, setLoadingChatRooms] = useState(false)
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const [profileCollapsed, setProfileCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profile_collapsed") === "true"
    }
    return false
  })

  // 프로필 접기/펼치기 상태 저장
  useEffect(() => {
    localStorage.setItem("profile_collapsed", profileCollapsed.toString())
  }, [profileCollapsed])

  // Load chat rooms
  useEffect(() => {
    const loadChatRooms = async () => {
      setLoadingChatRooms(true)
      try {
        if (sessionId) {
          const rooms = await getChatRooms(sessionId)
          setChatRooms(rooms)
        }
      } catch (error) {
        console.error("❌ Error loading chat rooms:", error)
      } finally {
        setLoadingChatRooms(false)
      }
    }

    loadChatRooms()
  }, [sessionId])

  const handleNewChat = async () => {
    if (creatingNewChat) return

    setCreatingNewChat(true)
    try {
      const newRoom = await createChatRoom({
        sessionId,
        title: "새로운 대화",
        roomType,
      })

      onNewChat()
      router.push(`/saju-chat/${roomType}?roomId=${newRoom.id}`)
      toast.success("새로운 대화를 시작했습니다")
    } catch (error) {
      console.error("❌ Error creating new chat:", error)
      toast.error("새 대화를 만들 수 없습니다")
    } finally {
      setCreatingNewChat(false)
    }
  }

  const handleDeleteChatRoom = async (chatRoomId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      await deleteChatRoom(chatRoomId)
      setChatRooms((prev) => prev.filter((room) => room.id !== chatRoomId))

      if (currentChatRoomId === chatRoomId) {
        router.push(`/saju-chat/${roomType}`)
      }

      toast.success("대화가 삭제되었습니다")
    } catch (error) {
      console.error("❌ Error deleting chat room:", error)
      toast.error("대화를 삭제할 수 없습니다")
    }
  }

  const handleChatRoomClick = (chatRoomId: string) => {
    onChatRoomSelect(chatRoomId)
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "방금 전"
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r">
      {/* Profile Section - Collapsible */}
      <div className="flex-shrink-0 border-b bg-white">
        <Collapsible open={!profileCollapsed} onOpenChange={(open) => setProfileCollapsed(!open)}>
          <div className="p-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-2 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-500">
                      {gender === "male" ? "남성" : "여성"} • {birthInfo?.solarYear}년생
                    </p>
                  </div>
                </div>
                {profileCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              <SajuDiagram saju={saju} name={name} gender={gender} variant="sidebar" {...birthInfo} />
              {calculatedDaeun && (
                <DaeunDiagram daeun={calculatedDaeun.pillars || []} birthInfo={birthInfo} name={name} gender={gender} />
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 p-4 bg-white border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              대화 목록
            </h3>
            <Button onClick={handleNewChat} disabled={creatingNewChat} size="sm" className="h-8 px-3 text-xs">
              <Plus className="h-3 w-3 mr-1" />새 대화
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {loadingChatRooms ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">아직 대화가 없습니다</p>
                <p className="text-xs text-gray-400 mt-1">새 대화를 시작해보세요</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleChatRoomClick(room.id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 ${
                      currentChatRoomId === room.id
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{room.title}</h4>
                        {room.lastMessage && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {room.lastMessage.role === "user" ? "나: " : "사주핑: "}
                            {room.lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(room.lastMessage?.createdAt || room.createdAt)}
                          </span>
                          {room.messageCount && room.messageCount > 0 && (
                            <span className="text-xs text-gray-400">{room.messageCount}개 메시지</span>
                          )}
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>대화 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 대화를 삭제하시겠습니까? 삭제된 대화는 복구할 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => handleDeleteChatRoom(room.id, e)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
