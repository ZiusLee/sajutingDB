"use client"

import { cn } from "@/lib/utils"

interface SajuLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

export function SajuLogo({ size = "md", className, onClick }: SajuLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gray-900 text-white",
        onClick && "cursor-pointer hover:bg-gray-800 transition-colors",
        sizeClasses[size],
        className,
      )}
      onClick={onClick}
    >
      S
    </div>
  )
}
