"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { v4 as uuidv4 } from "uuid"
import { BeatLoader } from "react-spinners"
import { createMemory } from "@/lib/memory-api-service"

interface Message {
  id: string | number
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

const SajuChat = () => {
  const { user, isLoading, error } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on message change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!content.trim()) return

    setLoading(true)

    const newMessage: Message = {
      id: uuidv4(),
      content: content,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
    setContent("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content, userId: user?.id }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.response) {
          const newAssistantMessage: Message = {
            id: Date.now() + 1,
            content: data.response,
            role: "assistant",
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, newAssistantMessage])

          // 메모리 추출 및 저장
          await extractAndSaveMemories(content, data.response)
        }
      } else {
        console.error("Failed to fetch chat response")
        const newAssistantMessage: Message = {
          id: Date.now() + 1,
          content: "챗봇 응답에 실패했습니다. 다시 시도해주세요.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newAssistantMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const newAssistantMessage: Message = {
        id: Date.now() + 1,
        content: "챗봇 응답에 실패했습니다. 다시 시도해주세요.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newAssistantMessage])
    } finally {
      setLoading(false)
    }
  }

  // 중요한 정보 자동 감지 및 저장
  const extractAndSaveMemories = async (userMessage: string, assistantResponse: string) => {
    if (!user?.id) return

    try {
      // 개인 정보 추출
      const nameMatch = userMessage.match(
        /(?:이름|성함).*?(?:은|는|이)?\s*([가-힣]{2,4})(?:이에요|예요|입니다|야|이야)/i,
      )
      if (nameMatch && nameMatch[1]) {
        await createMemory("context", `사용자 이름: ${nameMatch[1]}`, ["개인정보"], user.id)
      }

      // 나이 정보 추출
      const ageMatch = userMessage.match(/(?:나이|살).*?(?:은|는|이)?\s*(\d{1,2})(?:살|세|이에요|예요|입니다)/i)
      if (ageMatch && ageMatch[1]) {
        await createMemory("context", `사용자 나이: ${ageMatch[1]}세`, ["개인정보"], user.id)
      }

      // 직업 정보 추출
      const jobMatch = userMessage.match(
        /(?:직업|일|회사|업무).*?(?:은|는|이)?\s*([가-힣a-zA-Z\s]{2,20})(?:이에요|예요|입니다|해요|하고)/i,
      )
      if (jobMatch && jobMatch[1]) {
        await createMemory("context", `직업: ${jobMatch[1].trim()}`, ["직업"], user.id)
      }

      // 거주지 정보 추출
      const locationMatch = userMessage.match(
        /(?:살고|거주|사는|있는).*?(?:곳|지역|동네).*?(?:은|는|이)?\s*([가-힣\s]{2,20})(?:이에요|예요|입니다)/i,
      )
      if (locationMatch && locationMatch[1]) {
        await createMemory("context", `거주지: ${locationMatch[1].trim()}`, ["위치"], user.id)
      }

      // 연애 상태 추출
      const relationshipMatch = userMessage.match(
        /(썸|연애|사귀는|헤어진|이별한|솔로|싱글).*?(?:상태|중|이에요|예요|입니다)/i,
      )
      if (relationshipMatch) {
        let status = "알 수 없음"
        const matchText = relationshipMatch[0]
        if (matchText.includes("썸")) status = "썸 단계"
        else if (matchText.includes("사귀")) status = "연애 중"
        else if (matchText.includes("헤어") || matchText.includes("이별")) status = "이별 후"
        else if (matchText.includes("솔로") || matchText.includes("싱글")) status = "솔로"

        await createMemory("preference", `연애 상태: ${status}`, ["연애"], user.id)
      }

      // 관심사나 취미 추출
      const hobbyMatch = userMessage.match(
        /(?:좋아하는|취미|관심|즐기는).*?(?:은|는|이)?\s*([가-힣a-zA-Z\s]{2,20})(?:이에요|예요|입니다|야|이야)/i,
      )
      if (hobbyMatch && hobbyMatch[1]) {
        await createMemory("preference", `관심사/취미: ${hobbyMatch[1].trim()}`, ["취미"], user.id)
      }
    } catch (error) {
      console.error("Error extracting and saving memories:", error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="flex flex-col h-screen">
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`mb-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === "user" ? "bg-blue-200 text-black" : "bg-gray-200 text-black"
              }`}
            >
              {message.content}
            </div>
            <div className="text-xs text-gray-500">
              {message.role === "user" ? "You" : "SajuBot"} - {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <div className="inline-flex items-center p-2 rounded-lg bg-gray-200 text-black">
              <BeatLoader color="#000000" size={8} margin={2} />
            </div>
            <div className="text-xs text-gray-500">SajuBot is typing...</div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-100">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <input
            type="text"
            className="flex-grow px-4 py-2 focus:outline-none"
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault() // Prevent newline on Enter
                handleSendMessage()
              }
            }}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 focus:outline-none"
            onClick={handleSendMessage}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SajuChat
