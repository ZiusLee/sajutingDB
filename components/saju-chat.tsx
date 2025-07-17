"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"

export default function SajuChat() {
  const chatRef = useRef<HTMLDivElement>(null)
  const [inputEnabled, setInputEnabled] = useState(true)
  const { messages, input, setInput, handleSubmit, isLoading, error, stop } = useChat({
    api: "/api/chat",
    onFinish: () => {
      setInputEnabled(true)
    },
    onError: () => {
      setInputEnabled(true)
    },
  })

  const scrollToBottom = () => {
    if (chatRef.current) {
      const { scrollTop, clientHeight, scrollHeight } = chatRef.current
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        chatRef.current.scrollTop = scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setInputEnabled(false)
    await handleSubmit(e)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-grow overflow-y-scroll px-2 sm:px-3 py-4" ref={chatRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col text-sm ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-xl px-3 sm:px-4 py-2 inline-block max-w-2xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-700 rounded-bl-none"
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">{message.role === "user" ? "You" : "Saju"}</div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="rounded-xl px-3 sm:px-4 py-2 inline-block max-w-2xl bg-gray-200 text-gray-700 rounded-bl-none">
                Thinking...
              </div>
            </div>
          )}
          {error && <div className="text-red-500">Error: {error.message}</div>}
        </div>
      </div>

      <div className="px-2 sm:px-3 py-4 bg-white border-t border-gray-200">
        <form onSubmit={handleFormSubmit} className="relative">
          <input
            type="text"
            placeholder="Ask Saju anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={!inputEnabled}
          />
          {isLoading && (
            <button
              type="button"
              onClick={stop}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Stop
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
