"use client"

import { useEffect, useState, useCallback } from "react"

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const updateKeyboardState = useCallback(() => {
    if (typeof window === "undefined") return

    // Set CSS custom property for viewport height
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty("--vh", `${vh}px`)

    // Only apply keyboard detection on mobile devices
    if (window.innerWidth > 768) {
      setIsKeyboardOpen(false)
      setKeyboardHeight(0)
      return
    }

    let currentHeight = window.innerHeight // Declare currentHeight variable

    if (window.visualViewport) {
      const visualHeight = window.visualViewport.height
      const windowHeight = window.innerHeight
      const heightDiff = windowHeight - visualHeight

      // More precise keyboard detection - keyboard is open if visual viewport is significantly smaller
      if (heightDiff > 100) {
        setIsKeyboardOpen(true)
        setKeyboardHeight(0) // Don't use height diff, just detect keyboard state
      } else {
        setIsKeyboardOpen(false)
        setKeyboardHeight(0)
      }

      setViewportHeight(visualHeight) // Use visual viewport height
      currentHeight = visualHeight // Update currentHeight for later use
    } else {
      const screenHeight = window.screen.height

      // Fallback for older browsers
      const heightReduction = screenHeight - currentHeight
      const isLandscape = window.innerWidth > currentHeight
      const keyboardThreshold = isLandscape ? 200 : 300

      if (heightReduction > keyboardThreshold) {
        setIsKeyboardOpen(true)
        setKeyboardHeight(heightReduction)
      } else {
        setIsKeyboardOpen(false)
        setKeyboardHeight(0)
      }
    }

    setViewportHeight(currentHeight)
  }, [])

  useEffect(() => {
    // Initial setup
    updateKeyboardState()

    // Enhanced event listeners for better keyboard detection
    if (window.visualViewport) {
      // Modern browsers with Visual Viewport API
      window.visualViewport.addEventListener("resize", updateKeyboardState)
      window.visualViewport.addEventListener("scroll", updateKeyboardState)

      return () => {
        window.visualViewport?.removeEventListener("resize", updateKeyboardState)
        window.visualViewport?.removeEventListener("scroll", updateKeyboardState)
      }
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", updateKeyboardState)
      window.addEventListener("orientationchange", updateKeyboardState)

      // Additional events for better Android support
      const handleFocus = () => {
        setTimeout(updateKeyboardState, 300) // Delay for keyboard animation
      }

      const handleBlur = () => {
        setTimeout(updateKeyboardState, 300)
      }

      document.addEventListener("focusin", handleFocus)
      document.addEventListener("focusout", handleBlur)

      return () => {
        window.removeEventListener("resize", updateKeyboardState)
        window.removeEventListener("orientationchange", updateKeyboardState)
        document.removeEventListener("focusin", handleFocus)
        document.removeEventListener("focusout", handleBlur)
      }
    }
  }, [updateKeyboardState])

  return {
    isKeyboardOpen,
    keyboardHeight,
    viewportHeight,
    // Helper function to get safe bottom padding
    getSafeBottomPadding: () => {
      if (isKeyboardOpen) return 12
      return Math.max(
        12,
        Number.parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)") || "0",
        ),
      )
    },
  }
}
