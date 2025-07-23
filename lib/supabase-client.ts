import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a singleton instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tqrwktpmyylxyhgsrwlo.supabase.co",
      supabaseKey:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcndrdHBteXlseHloZ3Nyd2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEzNzA1NzYsImV4cCI6MjAyNjk0NjU3Nn0.Yd_6UO8X_XCZGjopPWbNxIEaW_yXONTkGPJlG_LBHV0",
      options: {
        auth: {
          persistSession: true,
          storageKey: "sajuping-auth",
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    })
  }
  return supabaseInstance
}

// Export createClient function for compatibility
export function createClient() {
  return getSupabase()
}

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tqrwktpmyylxyhgsrwlo.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcndrdHBteXlseHloZ3Nyd2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEzNzA1NzYsImV4cCI6MjAyNjk0NjU3Nn0.Yd_6UO8X_XCZGjopPWbNxIEaW_yXONTkGPJlG_LBHV0"

// Cache for file URLs to prevent duplicate fetches
const fileUrlCache: Record<string, string> = {}

// Export the supabase client for backward compatibility
export const supabase = getSupabase()

// Function to get file URL from Supabase storage with caching
export async function getFileUrl(bucket: string, path: string): Promise<string> {
  const cacheKey = `${bucket}/${path}`
  if (fileUrlCache[cacheKey]) {
    return fileUrlCache[cacheKey]
  }

  const client = getSupabase()
  try {
    const { data, error } = await client.storage.from(bucket).getPublicUrl(path)

    if (error) {
      console.error("Error getting file URL from Supabase:", error)
      throw error
    }

    fileUrlCache[cacheKey] = data.publicUrl
    return data.publicUrl
  } catch (error) {
    console.error("Failed to get file URL from Supabase:", error)
    throw error
  }
}

// Type definitions for our database tables
export interface User {
  id?: string
  name: string
  email?: string
  gender: string
  relationship_status: string
  is_beta_applicant: boolean
  auth_user_id?: string
}

export interface SajuSession {
  id?: string
  name: string
  email?: string
  gender: string
  relationship_status: string
  is_beta_applicant: boolean
  auth_user_id?: string
}

export interface BirthInfo {
  id?: string
  user_id: string
  solar_year: number
  solar_month: number
  solar_day: number
  solar_hour: number | null
  solar_minute: number | null
  lunar_year: number
  lunar_month: number
  lunar_day: number
  is_leap_month: boolean
  time_unknown: boolean
}

export interface SajuInfo {
  id?: string
  user_id: string
  year_stem: string
  year_branch: string
  year_stem_hanja: string
  year_branch_hanja: string
  month_stem: string
  month_branch: string
  month_stem_hanja: string
  month_branch_hanja: string
  day_stem: string
  day_branch: string
  day_stem_hanja: string
  day_branch_hanja: string
  hour_stem: string
  hour_branch: string
  hour_stem_hanja: string
  hour_branch_hanja: string
  day_master: string
  day_master_hanja: string
  year_animal: string
}

export interface Elements {
  id?: string
  saju_id: string
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

export interface Interpretation {
  id?: string
  user_id: string
  basic_interpretation: string
  model_used: string
  response_time: string
}

export interface AdditionalQuestion {
  id?: string
  user_id: string
  question_category: string
  question_text: string
  answer_text: string
  model_used: string
  response_time: string
}

export interface BetaApplication {
  id?: string
  user_id: string
  selected_services: string[]
  status: string
}

export interface CompatibilityAnalysis {
  id?: string
  user_id: string
  partner_name: string
  partner_gender: string
  partner_birth_year: number
  partner_birth_month: number
  partner_birth_day: number
  partner_birth_hour: number | null
  partner_birth_minute: number | null
  partner_time_unknown: boolean
  relationship_status: string
  compatibility_score: number
  analysis_text: string
  model_used: string
  response_time: string
}
