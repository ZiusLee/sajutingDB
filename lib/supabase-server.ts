import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tqrwktpmyylxyhgsrwlo.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create a Supabase client for server-side operations with admin privileges
export function createServerSupabaseClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Create a Supabase client with cookies for server components
// export function createServerComponentClient() {
//   const cookieStore = cookies()

//   return createClient(supabaseUrl, supabaseServiceKey, {
//     auth: {
//       persistSession: true,
//       autoRefreshToken: true,
//       detectSessionInUrl: false,
//       cookies: {
//         get(name) {
//           return cookieStore.get(name)?.value
//         },
//       },
//     },
//   })
// }

export function createServerComponentClientWithCookies({ cookies }: { cookies: () => any }) {
  return createServerComponentClient<Database>({ cookies })
}

// This is the function that app/actions.tsx is trying to import
// 기존 createClient 함수를 수정하여 cookies가 없을 때도 작동하도록 합니다
export function createClient({ cookies } = { cookies: () => undefined }) {
  return createServerComponentClient<Database>({ cookies })
}
