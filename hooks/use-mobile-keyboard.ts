"use client"

import { useEffect, useState } from "react"

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      // Check if we're on mobile
      if (window.innerWidth > 768) return

      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight

      // If viewport height is significantly smaller than window height, keyboard is likely open
      const heightDifference = windowHeight - viewportHeight
      const isOpen = heightDifference > 150 // Threshold for keyboard detection

      setIsKeyboardOpen(isOpen)
      setKeyboardHeight(isOpen ? heightDifference : 0)

      // Add class to body for CSS targeting
      if (isOpen) {
        document.body.classList.add("keyboard-open")
      } else {
        document.body.classList.remove("keyboard-open")
      }
    }

    // Listen to visual viewport changes (better for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", handleResize)
    }

    // Initial check
    handleResize()

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
      } else {
        window.removeEventListener("resize", handleResize)
      }
      document.body.classList.remove("keyboard-open")
    }
  }, [])

  return { isKeyboardOpen, keyboardHeight }
}
