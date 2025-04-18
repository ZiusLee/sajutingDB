import { getUserById } from "./user-service"
import { createSajuProfile, getSajuProfilesByUserId } from "./saju-profile-service"
import { createChatRoom, createMessage } from "./chat-service"

// 로컬 스토리지에서 사용자 데이터를 가져와 데이터베이스로 마이그레이션하는 함수
export async function migrateUserData(userId: string): Promise<boolean> {
  try {
    // 서버 환경에서는 실행하지 않음
    if (typeof window === "undefined") {
      console.log("서버 환경에서는 마이그레이션을 실행하지 않습니다.")
      return false
    }

    // 사용자 확인
    const user = await getUserById(userId)
    if (!user) {
      console.error("마이그레이션 실패: 사용자를 찾을 수 없습니다.")
      return false
    }

    // 이미 프로필이 있는지 확인
    const existingProfiles = await getSajuProfilesByUserId(userId)
    if (existingProfiles.length > 0) {
      console.log("이미 마이그레이션된 데이터가 있습니다.")
      return false
    }

    // 로컬 스토리지에서 사주 프로필 데이터 가져오기
    const sajuProfilesJson = localStorage.getItem("saju_profiles")
    if (!sajuProfilesJson) {
      console.log("마이그레이션할 사주 프로필 데이터가 없습니다.")
      return false
    }

    const sajuProfiles = JSON.parse(sajuProfilesJson)
    if (!Array.isArray(sajuProfiles) || sajuProfiles.length === 0) {
      console.log("마이그레이션할 사주 프로필 데이터가 없습니다.")
      return false
    }

    // 사주 프로필 마이그레이션
    const profileMap = new Map() // 로컬 ID와 새 ID 매핑

    for (const profile of sajuProfiles) {
      const newProfile = await createSajuProfile({
        userId,
        name: profile.name,
        gender: profile.gender,
        birthYear: profile.birthYear,
        birthMonth: profile.birthMonth,
        birthDay: profile.birthDay,
        birthHour: profile.birthHour,
        birthMinute: profile.birthMinute,
        isLunar: profile.isLunar,
      })

      profileMap.set(profile.id, newProfile.id)
    }

    // 채팅방 데이터 마이그레이션
    const chatRoomsJson = localStorage.getItem("chat_rooms")
    if (chatRoomsJson) {
      const chatRooms = JSON.parse(chatRoomsJson)

      if (Array.isArray(chatRooms) && chatRooms.length > 0) {
        for (const room of chatRooms) {
          // 프로필 ID 매핑
          const profileId = room.profileId ? profileMap.get(room.profileId) : null

          const newRoom = await createChatRoom({
            userId,
            profileId,
            title: room.title,
            roomType: room.roomType || "general",
          })

          // 메시지 마이그레이션
          if (room.messages && Array.isArray(room.messages)) {
            for (const message of room.messages) {
              await createMessage({
                chatRoomId: newRoom.id,
                senderType: message.senderType,
                content: message.content,
              })
            }
          }
        }
      }
    }

    console.log("데이터 마이그레이션 완료")
    return true
  } catch (error) {
    console.error("데이터 마이그레이션 오류:", error)
    return false
  }
}
