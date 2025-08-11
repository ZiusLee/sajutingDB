"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react"
import { getChatRooms, deleteChatRoom, updateChatRoom, type ChatRoom } from "@/lib/chat-room-service"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import SajuDiagram from "@/components/saju-diagram"

interface SidebarProps {
  saju: any
  name: string
  gender: string
  birthInfo: any
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
  sessionId,
  roomType,
  currentChatRoomId,
  onChatRoomSelect,
  onNewChat,
}: SidebarProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const loadChatRooms = async () => {
    try {
      setLoading(true)
      console.log("📂 Loading chat rooms for session:", sessionId)
      const rooms = await getChatRooms(sessionId)
      console.log("📂 Loaded chat rooms:", rooms)
      setChatRooms(rooms)
    } catch (error) {
      console.error("❌ Error loading chat rooms:", error)
      toast.error("채팅 목록을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) {
      loadChatRooms()
    }
  }, [sessionId])

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("이 대화를 삭제하시겠습니까?")) return

    try {
      await deleteChatRoom(roomId)
      setChatRooms((prev) => prev.filter((room) => room.id !== roomId))
      toast.success("대화가 삭제되었습니다.")

      // If the deleted room was the current one, redirect to new chat
      if (roomId === currentChatRoomId) {
        onNewChat()
      }
    } catch (error) {
      console.error("❌ Error deleting chat room:", error)
      toast.error("대화 삭제에 실패했습니다.")
    }
  }

  const handleEditRoom = (room: ChatRoom) => {
    setEditingRoomId(room.id)
    setEditingTitle(room.title)
  }

  const handleSaveEdit = async (roomId: string) => {
    if (!editingTitle.trim()) return

    try {
      const updatedRoom = await updateChatRoom(roomId, { title: editingTitle.trim() })
      setChatRooms((prev) => prev.map((room) => (room.id === roomId ? updatedRoom : room)))
      setEditingRoomId(null)
      setEditingTitle("")
      toast.success("제목이 변경되었습니다.")
    } catch (error) {
      console.error("❌ Error updating chat room:", error)
      toast.error("제목 변경에 실패했습니다.")
    }
  }

  const handleCancelEdit = () => {
    setEditingRoomId(null)
    setEditingTitle("")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("ko-KR", { weekday: "short" })
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">대화 목록</h2>
          <Button onClick={onNewChat} size="sm" className="bg-gray-900 hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-1" />새 대화
          </Button>
        </div>

        {/* Mini Saju Diagram */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-2">{name}님의 사주</div>
          <SajuDiagram
            saju={saju}
            name={name}
            gender={gender}
            variant="mini"
            solarYear={birthInfo?.solarYear}
            solarMonth={birthInfo?.solarMonth}
            solarDay={birthInfo?.solarDay}
            hour={birthInfo?.solarHour}
            minute={birthInfo?.solarMinute}
            timeUnknown={birthInfo?.timeUnknown}
            lunarYear={birthInfo?.lunarYear}
            lunarMonth={birthInfo?.lunarMonth}
            lunarDay={birthInfo?.lunarDay}
          />
        </div>
      </div>

      {/* Chat Rooms List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">아직 대화가 없습니다</p>
              <p className="text-xs mt-1">새 대화를 시작해보세요</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                    room.id === currentChatRoomId
                      ? "bg-gray-900 text-white"
                      : "bg-white hover:bg-gray-100 border border-gray-200"
                  }`}
                  onClick={() => !editingRoomId && onChatRoomSelect(room.id)}
                >
                  {editingRoomId === room.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(room.id)
                          if (e.key === "Escape") handleCancelEdit()
                        }}
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(room.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate mb-1">{room.title}</h3>
                          {room.lastMessage && (
                            <p
                              className={`text-xs truncate ${
                                room.id === currentChatRoomId ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {room.lastMessage.role === "user" ? "나: " : "AI: "}
                              {room.lastMessage.content}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <span
                            className={`text-xs ${room.id === currentChatRoomId ? "text-gray-300" : "text-gray-400"}`}
                          >
                            {formatDate(room.updatedAt || room.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-6 w-6 p-0 ${
                            room.id === currentChatRoomId ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-200"
                          }`}
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-6 w-6 p-0 ${
                            room.id === currentChatRoomId ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-200"
                          }`}
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
