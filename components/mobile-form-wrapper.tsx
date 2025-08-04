"use client"

import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MobileFormWrapperProps {
  children: ReactNode
  className?: string
  adjustForKeyboard?: boolean
}

export function MobileFormWrapper({ children, className, adjustForKeyboard = true }: MobileFormWrapperProps) {
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard()

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-in-out",
        adjustForKeyboard && isKeyboardOpen && "keyboard-adjust",
        className,
      )}
      style={{
        transform:
          adjustForKeyboard && isKeyboardOpen ? `translateY(-${Math.min(keyboardHeight * 0.3, 100)}px)` : undefined,
      }}
    >
      {children}
    </div>
  )
}
