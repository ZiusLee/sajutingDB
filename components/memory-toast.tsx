"use client"

import { useEffect } from "react"
import { CheckCircle, Brain } from "lucide-react"

interface MemoryToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
}

export default function MemoryToast({ message, isVisible, onClose }: MemoryToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-lg px-4 py-3 shadow-lg max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">💾 기억해둘게요</p>
            <p className="text-xs text-gray-300">{message}</p>
          </div>
          <CheckCircle className="h-4 w-4 text-green-400" />
        </div>
      </div>
    </div>
  )
}
