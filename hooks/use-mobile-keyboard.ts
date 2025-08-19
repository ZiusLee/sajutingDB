"use client"

import { useEffect, useState } from "react"

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isChrome = /Chrome/i.test(navigator.userAgent)
    const isAndroidChrome = isAndroid && isChrome

    // Set CSS custom property for viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty("--vh", `${vh}px`)
    }

    // Initial set
    setVH()

    const handleResize = () => {
      setVH()

      // Only apply keyboard detection on mobile devices
      if (window.innerWidth <= 768) {
        const currentHeight = window.innerHeight
        const currentWidth = window.innerWidth

        if (isAndroidChrome) {
          // Android Chrome에서는 screen.height 대신 초기 viewport height 사용
          const initialHeight = window.screen.availHeight || window.screen.height
          const heightReduction = initialHeight - currentHeight

          // Android에서는 더 낮은 임계값 사용 (주소창 등 고려)
          const keyboardThreshold = 250

          if (heightReduction > keyboardThreshold) {
            setIsKeyboardOpen(true)
            setKeyboardHeight(heightReduction)
          } else {
            setIsKeyboardOpen(false)
            setKeyboardHeight(0)
          }
        } else {
          // 기존 로직 (iOS 및 기타 브라우저)
          const heightReduction = window.screen.height - currentHeight
          const isLandscape = currentWidth > currentHeight

          // Adjust thresholds based on orientation
          const keyboardThreshold = isLandscape ? 200 : 300

          if (heightReduction > keyboardThreshold) {
            setIsKeyboardOpen(true)
            setKeyboardHeight(heightReduction)
          } else {
            setIsKeyboardOpen(false)
            setKeyboardHeight(0)
          }
        }
      }
    }

    // Visual viewport API for better keyboard detection (iOS Safari 13+)
    if (window.visualViewport && !isAndroidChrome) {
      const handleVisualViewportChange = () => {
        setVH()

        if (window.innerWidth <= 768) {
          const heightDiff = window.innerHeight - window.visualViewport.height

          if (heightDiff > 150) {
            setIsKeyboardOpen(true)
            setKeyboardHeight(heightDiff)
          } else {
            setIsKeyboardOpen(false)
            setKeyboardHeight(0)
          }
        }
      }

      window.visualViewport.addEventListener("resize", handleVisualViewportChange)

      return () => {
        window.visualViewport?.removeEventListener("resize", handleVisualViewportChange)
      }
    } else {
      window.addEventListener("resize", handleResize)

      if (isAndroid) {
        window.addEventListener("orientationchange", () => {
          setTimeout(handleResize, 500) // 방향 변경 후 약간의 지연
        })
      }

      return () => {
        window.removeEventListener("resize", handleResize)
        if (isAndroid) {
          window.removeEventListener("orientationchange", handleResize)
        }
      }
    }
  }, [])

  return { isKeyboardOpen, keyboardHeight }
}
