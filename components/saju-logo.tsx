"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getFileUrl } from "@/lib/supabase-storage"

interface SajuLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

export function SajuLogo({ size = "md", className = "", showText = true }: SajuLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // hasError will mean that all attempts to load an image (Supabase and local fallback) have failed.
  const [hasError, setHasError] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    let isMounted = true

    async function fetchInitialLogoUrl() {
      if (!isMounted) return
      setIsLoading(true)
      try {
        // Try to get the URL from Supabase first
        const url = await getFileUrl("sajuping", "sajuping_character.png")
        if (isMounted) {
          console.log("Fetched logo URL from Supabase:", url)
          setLogoUrl(url)
          setHasError(false) // Attempting Supabase URL, so not in error state yet
        }
      } catch (error) {
        console.error("Error fetching logo from Supabase, attempting local fallback:", error)
        if (isMounted) {
          setLogoUrl("/images/sajuping_character.png") // Fallback to local if Supabase fetch itself fails
          setHasError(false) // Attempting local URL, so not in error state yet
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchInitialLogoUrl()

    return () => {
      isMounted = false
    }
  }, [])

  const handleImageError = () => {
    // This function is called when the <Image> component's onError event fires.
    if (logoUrl === "/images/sajuping_character.png" || hasError) {
      // If the current logoUrl is already the local fallback and it failed,
      // OR if hasError is already true (e.g. from a previous failed attempt at local)
      // then all image attempts have failed.
      console.error(`Image failed to load: ${logoUrl}. All fallbacks exhausted. Displaying text logo.`)
      if (!hasError) {
        // Only update state if it's not already true to prevent potential loops
        setHasError(true)
      }
    } else {
      // If the primary (Supabase) URL failed, try the local fallback.
      console.warn(`Primary image URL (${logoUrl}) failed. Attempting local fallback: /images/sajuping_character.png`)
      setLogoUrl("/images/sajuping_character.png")
      setHasError(false) // Reset hasError because we are trying a new source (the local fallback)
    }
  }

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  const TextLogo = () => (
    <div
      className={`flex items-center justify-center bg-indigo-600 text-white rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <span className="font-bold text-sm">사주</span>
    </div>
  )

  if (!isClient) {
    // For SSR or initial render before hydration, show TextLogo for consistency.
    // This helps prevent layout shifts.
    return (
      <div className={`flex items-center ${className}`}>
        <TextLogo />
        {showText && <span className="ml-2 font-bold text-lg dark:text-white">사주핑</span>}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
          <div className="w-1/2 h-1/2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        {showText && <span className="ml-2 font-bold text-lg dark:text-white">사주핑</span>}
      </div>
    )
  }

  // If hasError is true, all image attempts failed, show TextLogo.
  // Also, if logoUrl is null after loading (e.g. initial fetch failed to set any URL), show TextLogo.
  if (hasError || !logoUrl) {
    return (
      <div className={`flex items-center ${className}`}>
        <TextLogo />
        {showText && <span className="ml-2 font-bold text-lg dark:text-white">사주핑</span>}
      </div>
    )
  }

  // If we have a logoUrl and no definitive error yet, attempt to render the Image.
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src={logoUrl || "/placeholder.svg"} // logoUrl is guaranteed to be non-null here
          alt="사주핑 로고"
          fill
          className="object-contain"
          priority
          onError={handleImageError} // Use the corrected handler
          unoptimized={true}
        />
      </div>
      {showText && <span className="ml-2 font-bold text-lg dark:text-white">사주핑</span>}
    </div>
  )
}
