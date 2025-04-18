"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSajuProfiles } from "@/app/actions"

const ChatList = () => {
  const router = useRouter()

  useEffect(() => {
    const checkProfiles = async () => {
      try {
        const profiles = await getSajuProfiles()

        if (!profiles || profiles.length === 0) {
          // No profiles, redirect to the chat page which will show the message
          router.push("/chat")
        }
      } catch (error) {
        console.error("Error checking profiles:", error)
      }
    }

    checkProfiles()
  }, [router])

  return (
    <div>
      <h1>Chat List</h1>
      {/* Add your chat list UI here */}
    </div>
  )
}

export default ChatList
