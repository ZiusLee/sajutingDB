"use client"

import React from "react"

import type { ReactElement } from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, MessageSquare } from "lucide-react"
import SajuDiagram from "@/components/saju-diagram"
import { getChatRooms, deleteChatRoom, type ChatRoom } from "@/lib/chat-room-service"
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
import type { BirthInfo } from "@/types/birth-date"

interface SidebarProps {
  saju: any
  name: string
  gender: string
  birthInfo?: BirthInfo
  sessionId: string
  roomType: string
  currentChatRoomId?: string
  onChatRoomSelect: (chatRoomId: string) => void
  onNewChat: () => void
}

const ChatRoomItem = React.memo(
  ({
    room,
    isActive,
    onSelect,
    onDelete,
    formatRelativeTime,
  }: {
    room: ChatRoom
    isActive: boolean
    onSelect: (id: string) => void
    onDelete: (id: string, event: React.MouseEvent) => void
    formatRelativeTime: (date: string) => string
  }) => (
    <div
      onClick={() => onSelect(room.id)}
      className={`group relative p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100/80 ${
        isActive ? "bg-gray-900 text-white shadow-sm" : "bg-white/60 border border-gray-200/50 hover:border-gray-300/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-xs truncate ${isActive ? "text-white" : "text-gray-900"}`}>{room.title}</h4>
          {room.lastMessage && (
            <p className={`text-xs mt-1 truncate ${isActive ? "text-gray-300" : "text-gray-500"}`}>
              {room.lastMessage.role === "user" ? "나: " : "사주핑: "}
              {room.lastMessage.content}
            </p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs ${isActive ? "text-gray-400" : "text-gray-400"}`}>
              {formatRelativeTime(room.lastMessage?.createdAt || room.createdAt)}
            </span>
            {room.messageCount && room.messageCount > 0 && (
              <span className={`text-xs ${isActive ? "text-gray-400" : "text-gray-400"}`}>{room.messageCount}개</span>
            )}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 ml-2 hover:bg-red-100 hover:text-red-600 ${
                isActive ? "hover:bg-red-900/20" : ""
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-2.5 w-2.5" />
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
              <AlertDialogAction onClick={(e) => onDelete(room.id, e)} className="bg-red-600 hover:bg-red-700">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  ),
)

ChatRoomItem.displayName = "ChatRoomItem"

export default function Sidebar({
  saju,
  name,
  gender,
  birthInfo,
  sessionId,
  roomType,
  currentChatRoomId,
  onChatRoomSelect,
  onNewChat,
}: SidebarProps): ReactElement {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loadingChatRooms, setLoadingChatRooms] = useState(false)
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0)

  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "방금 전"
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
  }, [])

  const loadChatRooms = useCallback(async () => {
    if (!sessionId || loadingChatRooms) return

    setLoadingChatRooms(true)
    try {
      // Check cache first
      const cacheKey = `chatRooms_${sessionId}`
      const cached = sessionStorage.getItem(cacheKey)
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`)

      // Use cache if less than 30 seconds old
      if (cached && cacheTime && Date.now() - Number.parseInt(cacheTime) < 30000) {
        setChatRooms(JSON.parse(cached))
        setLoadingChatRooms(false)
        return
      }

      const rooms = await getChatRooms(sessionId)
      setChatRooms(rooms)

      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify(rooms))
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString())
    } catch (error) {
      console.error("❌ Error loading chat rooms:", error)
    } finally {
      setLoadingChatRooms(false)
    }
  }, [sessionId, loadingChatRooms])

  // Load chat rooms
  useEffect(() => {
    loadChatRooms()
  }, [loadChatRooms])

  const handleNewChat = useCallback(async () => {
    if (creatingNewChat) return

    setCreatingNewChat(true)
    try {
      onNewChat()
      router.push(`/saju-chat/${roomType}`)
      toast.success("새로운 대화를 시작했습니다")
    } catch (error) {
      console.error("❌ Error creating new chat:", error)
      toast.error("새 대화를 만들 수 없습니다")
    } finally {
      setCreatingNewChat(false)
    }
  }, [creatingNewChat, onNewChat, router, roomType])

  const handleDeleteChatRoom = useCallback(
    async (chatRoomId: string, event: React.MouseEvent) => {
      event.stopPropagation()

      try {
        await deleteChatRoom(chatRoomId)
        setChatRooms((prev) => prev.filter((room) => room.id !== chatRoomId))

        // Invalidate cache
        const cacheKey = `chatRooms_${sessionId}`
        sessionStorage.removeItem(cacheKey)
        sessionStorage.removeItem(`${cacheKey}_time`)

        if (currentChatRoomId === chatRoomId) {
          router.push(`/saju-chat/${roomType}`)
        }

        toast.success("대화가 삭제되었습니다")
      } catch (error) {
        console.error("❌ Error deleting chat room:", error)
        toast.error("대화를 삭제할 수 없습니다")
      }
    },
    [sessionId, currentChatRoomId, router, roomType],
  )

  const handleChatRoomClick = useCallback(
    (chatRoomId: string) => {
      onChatRoomSelect(chatRoomId)
    },
    [onChatRoomSelect],
  )

  const handleProfileUpdate = useCallback(
    (updatedProfile: any) => {
      console.log("[v0] Profile updated in sidebar:", updatedProfile)
      // 프로필 업데이트 트리거 증가로 컴포넌트 리렌더링 유도
      setProfileUpdateTrigger((prev) => prev + 1)

      // 채팅룸 캐시 무효화
      const cacheKey = `chatRooms_${sessionId}`
      sessionStorage.removeItem(cacheKey)
      sessionStorage.removeItem(`${cacheKey}_time`)

      // 채팅룸 목록 새로고침
      loadChatRooms()
    },
    [sessionId, loadChatRooms],
  )

  const chatRoomList = useMemo(() => {
    if (loadingChatRooms) {
      return (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )
    }

    if (chatRooms.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">아직 대화가 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">새 대화를 시작해보세요</p>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {chatRooms.map((room) => (
          <ChatRoomItem
            key={room.id}
            room={room}
            isActive={currentChatRoomId === room.id}
            onSelect={handleChatRoomClick}
            onDelete={handleDeleteChatRoom}
            formatRelativeTime={formatRelativeTime}
          />
        ))}
      </div>
    )
  }, [chatRooms, loadingChatRooms, currentChatRoomId, handleChatRoomClick, handleDeleteChatRoom, formatRelativeTime])

  return (
    <div className="h-full overflow-y-auto bg-transparent">
      <div className="border-b border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <SajuDiagram
          saju={saju}
          name={name}
          gender={gender}
          variant="sidebar"
          solarYear={birthInfo?.solarYear}
          solarMonth={birthInfo?.solarMonth}
          solarDay={birthInfo?.solarDay}
          hour={birthInfo?.solarHour}
          minute={birthInfo?.solarMinute}
          lunarYear={birthInfo?.lunarYear}
          lunarMonth={birthInfo?.lunarMonth}
          lunarDay={birthInfo?.lunarDay}
          timeUnknown={birthInfo?.timeUnknown}
          location="서울특별시"
          onProfileUpdate={handleProfileUpdate}
        />
      </div>

      <div className="bg-white/90 backdrop-blur-sm">
        <div className="p-3 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
              <MessageSquare className="h-3.5 w-3.5" />
              대화 목록
            </h3>
            <Button
              onClick={handleNewChat}
              disabled={creatingNewChat}
              size="sm"
              className="h-7 px-2.5 text-xs bg-gray-900 hover:bg-gray-800 text-white rounded-md"
            >
              <Plus className="h-3 w-3 mr-1" />새 대화
            </Button>
          </div>
        </div>

        <div className="p-2">{chatRoomList}</div>
      </div>
    </div>
  )
}
