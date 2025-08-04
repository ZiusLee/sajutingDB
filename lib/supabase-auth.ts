import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function signInWithSocial(provider: "kakao" | "google" | "facebook" | "apple") {
  try {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error(`${provider} 로그인 오류:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `${provider} 로그인 중 오류가 발생했습니다.`,
    }
  }
}
