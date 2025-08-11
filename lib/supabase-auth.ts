"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function signInWithSocial(provider: "kakao" | "google" | "facebook" | "apple", redirectTo?: string) {
  try {
    console.log(`🔐 Starting ${provider} social login...`)
    const supabase = createClientComponentClient()

    const options: any = {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    }

    // Google-specific options
    if (provider === "google") {
      options.queryParams = {
        access_type: "offline",
        prompt: "consent",
      }
      options.scopes = "openid email profile"
    }

    console.log("OAuth options:", options)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    })

    if (error) {
      console.error(`❌ ${provider} 로그인 오류:`, error)
      throw error
    }

    console.log(`✅ ${provider} 로그인 성공:`, data)
    return { success: true, data }
  } catch (error) {
    console.error(`❌ ${provider} 로그인 오류:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `${provider} 로그인 중 오류가 발생했습니다.`,
    }
  }
}
