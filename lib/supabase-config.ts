// Supabase 설정 확인을 위한 유틸리티 함수

export function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error("Supabase 환경 변수가 설정되지 않았습니다.")
    console.error(`NEXT_PUBLIC_SUPABASE_URL: ${url ? "설정됨" : "설정되지 않음"}`)
    console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? "설정됨" : "설정되지 않음"}`)
    return false
  }

  return true
}

// 현재 설정된 Supabase URL 반환
export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL
}
