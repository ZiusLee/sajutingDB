"use client"

import { useAuth } from "@/contexts/auth-context"

export function TermsDialog({ open, onOpenChange, onAccept }: TermsDialogProps) {
  const { user } = useAuth()

  // Don't show dialog if user is already logged in
  if (user) {
    return null
  }

  // Rest of the component remains the same
}
