"use client"

import { useEffect, useState } from "react"

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    // Set CSS custom property for viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Initial set
    setVH()

    // iOS Safari keyboard detection
    const handleResize = () => {
      setVH()
      
      // Only apply keyboard detection on mobile devices
      if (window.innerWidth <= 768) {
        const currentHeight = window.innerHeight
        const currentWidth = window.innerWidth
        
        // Detect keyboard by significant height reduction
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

    // Visual viewport API for better keyboard detection (iOS Safari 13+)
    if (window.visualViewport) {
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

      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportChange)
      }
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return { isKeyboardOpen, keyboardHeight }
}
