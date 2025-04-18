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
  const [hasError, setHasError] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Fetch the logo URL from Supabase storage
    async function fetchLogoUrl() {
      try {
        setIsLoading(true)
        // Try to get the URL from Supabase first
        const url = await getFileUrl("sajuping", "sajuping_character.png")
        console.log("Fetched logo URL from Supabase:", url)
        setLogoUrl(url)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching logo from Supabase:", error)
        // If Supabase fetch fails, use the local image path as fallback
        setLogoUrl("/images/sajuping_character.png")
        setHasError(false) // Reset error state since we're using fallback
        setIsLoading(false)
      }
    }

    fetchLogoUrl()
  }, [])

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  const handleImageError = () => {
    console.error("Failed to load image from Supabase URL:", logoUrl)
    setHasError(true)
  }

  // Create a text-based logo as fallback
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

  // Show loading spinner while fetching the URL
  if (isClient && isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
          <div className="w-1/2 h-1/2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        {showText && <span className="ml-2 font-bold text-lg dark:text-white">사주핑</span>}
      </div>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      {isClient &&
        (logoUrl && !hasError ? (
          <div className={`relative ${sizeClasses[size]}`}>
            <Image
              src={logoUrl || "/placeholder.svg"}
              alt="사주핑 로고"
              fill
              className="object-contain"
              priority
              onError={() => {
                console.error("Failed to load image, falling back to local path")
                setLogoUrl("/images/sajuping_character.png")
              }}
              unoptimized={true}
            />
          </div>
        ) : (
          <TextLogo />
        ))}

      {showText && <span className="ml-2 font-bold text-lg dark:text-white">사주핑</span>}
    </div>
  )
}
