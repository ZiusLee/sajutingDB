"use client"

import { useEffect, useState } from "react"

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const updateViewportHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight
      setViewportHeight(height)

      document.documentElement.style.setProperty("--viewport-height", `${height}px`)
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`)

      // 실제 가용 높이에서 하단 네비게이션 바 높이 제외
      const availableHeight = height - 60 // 하단 네비게이션 바 높이
      document.documentElement.style.setProperty("--available-height", `${availableHeight}px`)
    }

    // 초기 설정
    updateViewportHeight()

    const handleViewportChange = () => {
      updateViewportHeight()

      // 모바일에서만 키보드 감지 실행
      if (window.innerWidth <= 768) {
        const documentHeight = document.documentElement.clientHeight
        const viewportHeight = window.visualViewport?.height || window.innerHeight
        const calculatedKeyboardHeight = documentHeight - viewportHeight

        const keyboardThreshold = 150

        if (calculatedKeyboardHeight > keyboardThreshold) {
          setIsKeyboardOpen(true)
          setKeyboardHeight(calculatedKeyboardHeight)
          document.body.classList.add("keyboard-open")

          const chatContainer = document.querySelector(".chat-messages-container") as HTMLElement
          const chatInput = document.querySelector(".chat-input-container") as HTMLElement

          if (chatContainer && chatInput) {
            const contentHeight = chatContainer.scrollHeight
            const containerHeight = chatContainer.clientHeight
            const scrollRatio = contentHeight / containerHeight
            const currentScrollTop = chatContainer.scrollTop
            const maxScroll = contentHeight - containerHeight
            const scrollPercentage = maxScroll > 0 ? currentScrollTop / maxScroll : 0

            console.log("[v0] Keyboard analysis:", {
              contentHeight,
              containerHeight,
              scrollRatio,
              scrollPercentage,
              keyboardHeight: calculatedKeyboardHeight,
            })

            // 콘텐츠가 짧을 때 (스크롤이 거의 없을 때) 특별 처리
            if (scrollRatio < 1.5) {
              // 짧은 콘텐츠: 키보드 높이를 더 정확히 계산하여 적용
              const adjustedKeyboardHeight = Math.min(calculatedKeyboardHeight, viewportHeight * 0.4)
              chatInput.style.bottom = `${adjustedKeyboardHeight}px`

              // 전체 컨테이너 높이를 키보드만큼 줄임
              chatContainer.style.maxHeight = `calc(var(--available-height) - ${adjustedKeyboardHeight}px)`
            } else {
              // 긴 콘텐츠: 기존 방식 사용하되 스크롤 위치 고려
              const dynamicKeyboardHeight = calculatedKeyboardHeight * (1 - scrollPercentage * 0.3)
              chatInput.style.bottom = `${dynamicKeyboardHeight}px`

              // 스크롤이 하단 근처에 있을 때만 자동 스크롤
              if (scrollPercentage > 0.8) {
                setTimeout(() => {
                  chatContainer.scrollTop = maxScroll
                }, 100)
              }
            }
          }
        } else {
          setIsKeyboardOpen(false)
          setKeyboardHeight(0)
          document.body.classList.remove("keyboard-open")

          const chatInput = document.querySelector(".chat-input-container") as HTMLElement
          const chatContainer = document.querySelector(".chat-messages-container") as HTMLElement

          if (chatInput) {
            chatInput.style.bottom = "0px"
          }

          if (chatContainer) {
            chatContainer.style.maxHeight = ""
          }
        }
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange)
      window.visualViewport.addEventListener("scroll", updateViewportHeight)

      return () => {
        window.visualViewport?.removeEventListener("resize", handleViewportChange)
        window.visualViewport?.removeEventListener("scroll", updateViewportHeight)
        document.body.classList.remove("keyboard-open")
      }
    } else {
      // 폴백: resize 이벤트 사용
      window.addEventListener("resize", handleViewportChange)

      return () => {
        window.removeEventListener("resize", handleViewportChange)
        document.body.classList.remove("keyboard-open")
      }
    }
  }, [])

  return { isKeyboardOpen, keyboardHeight, viewportHeight }
}
