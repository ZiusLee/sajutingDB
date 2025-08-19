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

      // CSS 변수로 실시간 viewport 높이 업데이트
      document.documentElement.style.setProperty("--viewport-height", `${height}px`)
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`)
    }

    // 초기 설정
    updateViewportHeight()

    const handleViewportChange = () => {
      updateViewportHeight()

      // 모바일에서만 키보드 감지 실행
      if (window.innerWidth <= 768) {
        const currentHeight = window.visualViewport?.height || window.innerHeight
        const windowHeight = window.innerHeight
        const heightDiff = windowHeight - currentHeight

        const keyboardThreshold = 150

        if (heightDiff > keyboardThreshold) {
          setIsKeyboardOpen(true)
          setKeyboardHeight(heightDiff)
          document.body.classList.add("keyboard-open")
        } else {
          setIsKeyboardOpen(false)
          setKeyboardHeight(0)
          document.body.classList.remove("keyboard-open")
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
