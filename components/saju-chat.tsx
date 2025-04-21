"use client"

import type React from "react"

interface SajuChatProps {
  saju: any
  name: string
  gender: string
  initialInterpretation: string
  roomType: string
  onBack: () => void
  isLoggedIn: boolean
}

const SajuChat: React.FC<SajuChatProps> = ({
  saju,
  name,
  gender,
  initialInterpretation,
  roomType,
  onBack,
  isLoggedIn,
}) => {
  return (
    <div>
      <h1>SajuChat</h1>
    </div>
  )
}

export default SajuChat
