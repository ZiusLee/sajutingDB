import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Transfers anonymous user data to authenticated user
 * @param userId The authenticated user ID
 */
export async function transferAnonymousDataToUser(userId: string): Promise<boolean> {
  try {
    console.log("Transferring anonymous data to user:", userId)

    // Get anonymous user ID from localStorage
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.log("No anonymous data found")
      return false
    }

    const sajuData = JSON.parse(tempSajuData)
    const anonymousId = sajuData.userId

    if (!anonymousId) {
      console.log("No anonymous ID found")
      return false
    }

    console.log("Anonymous ID:", anonymousId)

    // Update the user ID in localStorage
    sajuData.userId = userId
    localStorage.setItem("tempSajuData", JSON.stringify(sajuData))

    // Transfer chat data
    transferChatData(anonymousId, userId)

    // Transfer saju profiles
    transferSajuProfiles(anonymousId, userId)

    // Call API to update database records
    try {
      const response = await fetch("/api/transfer-user-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonymousId,
          userId,
        }),
      })

      if (!response.ok) {
        console.error("Failed to transfer data in database:", await response.text())
      } else {
        console.log("Successfully transferred data in database")
      }
    } catch (error) {
      console.error("Error calling transfer API:", error)
    }

    return true
  } catch (error) {
    console.error("Error transferring anonymous data:", error)
    return false
  }
}

/**
 * Transfers chat data from anonymous user to authenticated user
 */
function transferChatData(anonymousId: string, userId: string): void {
  try {
    const chatData = localStorage.getItem("saju_chat_sessions")
    if (!chatData) return

    const parsedData = JSON.parse(chatData)

    // Find data for anonymous user
    const anonymousUserKeys = Object.keys(parsedData).filter((key) => key.includes(anonymousId) || !key.includes("_"))

    if (anonymousUserKeys.length === 0) return

    // Create new data structure with authenticated user ID
    anonymousUserKeys.forEach((oldKey) => {
      const keyParts = oldKey.split("_")
      const name = keyParts[0]
      const newKey = `${name}_${userId}`

      // Transfer data to new key
      parsedData[newKey] = parsedData[oldKey]

      // Delete old key if different
      if (oldKey !== newKey) {
        delete parsedData[oldKey]
      }
    })

    // Save updated data
    localStorage.setItem("saju_chat_sessions", JSON.stringify(parsedData))
    console.log("Chat data transferred successfully")
  } catch (error) {
    console.error("Error transferring chat data:", error)
  }
}

/**
 * Transfers saju profiles from anonymous user to authenticated user
 */
function transferSajuProfiles(anonymousId: string, userId: string): void {
  try {
    const profilesData = localStorage.getItem("saju_profiles")
    if (!profilesData) return

    const profiles = JSON.parse(profilesData)
    if (!Array.isArray(profiles)) return

    // Update user ID in all profiles
    const updatedProfiles = profiles.map((profile) => {
      if (profile.userId === anonymousId || !profile.userId) {
        return { ...profile, userId }
      }
      return profile
    })

    // Save updated profiles
    localStorage.setItem("saju_profiles", JSON.stringify(updatedProfiles))
    console.log("Saju profiles transferred successfully")
  } catch (error) {
    console.error("Error transferring saju profiles:", error)
  }
}

/**
 * Gets saju profiles for the current user
 */
export async function getSajuProfiles(): Promise<any[]> {
  try {
    // Get current user ID
    const supabase = createClientComponentClient()
    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id

    if (userId) {
      // Try to get profiles from API first
      try {
        const response = await fetch(`/api/saju-profiles?userId=${userId}`)

        if (response.ok) {
          const data = await response.json()
          if (data.profiles && Array.isArray(data.profiles)) {
            // Update localStorage with latest data
            localStorage.setItem("saju_profiles", JSON.stringify(data.profiles))
            return data.profiles
          }
        }
      } catch (error) {
        console.error("Error fetching profiles from API:", error)
      }
    }

    // Fall back to localStorage
    const profilesData = localStorage.getItem("saju_profiles")
    if (!profilesData) return []

    const profiles = JSON.parse(profilesData)
    if (!Array.isArray(profiles)) return []

    // Filter by user ID if authenticated
    if (userId) {
      return profiles.filter((profile: any) => !profile.userId || profile.userId === userId)
    }

    return profiles
  } catch (error) {
    console.error("Error getting saju profiles:", error)
    return []
  }
}

/**
 * Gets chat history for the current user
 */
export async function getChatHistory(): Promise<any[]> {
  try {
    // Get current user ID
    const supabase = createClientComponentClient()
    const { data } = await supabase.auth.getUser()
    const userId = data.user?.id

    if (userId) {
      // Try to get chat history from API first
      try {
        const response = await fetch(`/api/chat-rooms?userId=${userId}`)

        if (response.ok) {
          const data = await response.json()
          if (data.chatRooms && Array.isArray(data.chatRooms)) {
            return data.chatRooms
          }
        }
      } catch (error) {
        console.error("Error fetching chat history from API:", error)
      }
    }

    // Fall back to localStorage
    const chatData = localStorage.getItem("saju_chat_sessions")
    if (!chatData) return []

    const parsedData = JSON.parse(chatData)
    const sessions = []

    // Find data for current user
    const userKeys = userId ? Object.keys(parsedData).filter((key) => key.includes(userId)) : Object.keys(parsedData)

    for (const key of userKeys) {
      const session = parsedData[key]
      sessions.push({
        roomType: session.roomType,
        lastMessage: session.messages[session.messages.length - 1]?.content || "",
        lastMessageTime: session.lastMessageTime,
        messages: session.messages,
        saju: session.saju,
        name: session.name,
      })
    }

    // Sort by most recent
    return sessions.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
  } catch (error) {
    console.error("Error getting chat history:", error)
    return []
  }
}
