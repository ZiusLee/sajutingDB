"use client"

import { useEffect, useState } from "react"

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.innerWidth <= 768 && window.visualViewport) {
        const viewportHeight = window.visualViewport.height
        const windowHeight = window.innerHeight
        const heightDifference = windowHeight - viewportHeight

        // 키보드가 열렸는지 간단하게 판단
        if (heightDifference > 150) {
          setIsKeyboardOpen(true)
          setKeyboardHeight(heightDifference)

          // CSS 변수로 키보드 높이 전달
          document.documentElement.style.setProperty("--keyboard-height", `${heightDifference}px`)
          document.body.classList.add("keyboard-open")
        } else {
          setIsKeyboardOpen(false)
          setKeyboardHeight(0)

          document.documentElement.style.setProperty("--keyboard-height", "0px")
          document.body.classList.remove("keyboard-open")
        }
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange)

      return () => {
        window.visualViewport?.removeEventListener("resize", handleViewportChange)
        document.body.classList.remove("keyboard-open")
      }
    }
  }, [])

  return { isKeyboardOpen, keyboardHeight }
}
