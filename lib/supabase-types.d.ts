// Define Supabase database types for better type safety
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          gender: string
          relationship_status: string
          is_beta_applicant: boolean
          phone: string | null // 핸드폰 번호 필드 추가
          saju_info: string | null // 사주 정보 필드 추가
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          gender: string
          relationship_status: string
          is_beta_applicant?: boolean
          phone?: string | null // 핸드폰 번호 필드 추가
          saju_info?: string | null // 사주 정보 필드 추가
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          gender?: string
          relationship_status?: string
          is_beta_applicant?: boolean
          phone?: string | null // 핸드폰 번호 필드 추가
          saju_info?: string | null // 사주 정보 필드 추가
          created_at?: string
          updated_at?: string
        }
      }
      birth_info: {
        Row: {
          id: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          solar_year: number
          solar_month: number
          solar_day: number
          solar_hour?: number | null
          solar_minute?: number | null
          lunar_year: number
          lunar_month: number
          lunar_day: number
          is_leap_month?: boolean
          time_unknown?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          solar_year?: number
          solar_month?: number
          solar_day?: number
          solar_hour?: number | null
          solar_minute?: number | null
          lunar_year?: number
          lunar_month?: number
          lunar_day?: number
          is_leap_month?: boolean
          time_unknown?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      saju_info: {
        Row: {
          id: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year_stem?: string
          year_branch?: string
          year_stem_hanja?: string
          year_branch_hanja?: string
          month_stem?: string
          month_branch?: string
          month_stem_hanja?: string
          month_branch_hanja?: string
          day_stem?: string
          day_branch?: string
          day_stem_hanja?: string
          day_branch_hanja?: string
          hour_stem?: string
          hour_branch?: string
          hour_stem_hanja?: string
          hour_branch_hanja?: string
          day_master?: string
          day_master_hanja?: string
          year_animal?: string
          created_at?: string
          updated_at?: string
        }
      }
      elements: {
        Row: {
          id: string
          saju_id: string
          wood: number
          fire: number
          earth: number
          metal: number
          water: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          saju_id: string
          wood: number
          fire: number
          earth: number
          metal: number
          water: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          saju_id?: string
          wood?: number
          fire?: number
          earth?: number
          metal?: number
          water?: number
          created_at?: string
          updated_at?: string
        }
      }
      interpretations: {
        Row: {
          id: string
          user_id: string
          basic_interpretation: string
          model_used: string
          response_time: string
          user_feedback: string | null // 피드백 필드 추가
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          basic_interpretation: string
          model_used: string
          response_time: string
          user_feedback?: string | null // 피드백 필드 추가
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          basic_interpretation?: string
          model_used?: string
          response_time?: string
          user_feedback?: string | null // 피드백 필드 추가
          created_at?: string
          updated_at?: string
        }
      }
      additional_questions: {
        Row: {
          id: string
          user_id: string
          question_category: string
          question_text: string
          answer_text: string
          model_used: string
          response_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_category: string
          question_text: string
          answer_text: string
          model_used: string
          response_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_category?: string
          question_text?: string
          answer_text?: string
          model_used?: string
          response_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      beta_applications: {
        Row: {
          id: string
          user_id: string
          selected_services: string[]
          application_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          selected_services: string[]
          application_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          selected_services?: string[]
          application_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      compatibility_analysis: {
        Row: {
          id: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_name: string
          partner_gender: string
          partner_birth_year: number
          partner_birth_month: number
          partner_birth_day: number
          partner_birth_hour?: number | null
          partner_birth_minute?: number | null
          partner_time_unknown?: boolean
          relationship_status: string
          compatibility_score: number
          analysis_text: string
          model_used: string
          response_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          partner_name?: string
          partner_gender?: string
          partner_birth_year?: number
          partner_birth_month?: number
          partner_birth_day?: number
          partner_birth_hour?: number | null
          partner_birth_minute?: number | null
          partner_time_unknown?: boolean
          relationship_status?: string
          compatibility_score?: number
          analysis_text?: string
          model_used?: string
          response_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          interpretation_id: string
          feedback_type: string
          feedback_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          interpretation_id: string
          feedback_type: string
          feedback_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interpretation_id?: string
          feedback_type?: string
          feedback_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Update the beta_applications interface to include privacy_consent
export interface BetaApplication {
  id?: string
  user_id: string
  selected_services: string[]
  status: string
  application_date?: string
  privacy_consent: boolean
}

// Update the User interface to include privacy_consent
export interface User {
  id?: string
  name: string
  email?: string
  gender: string
  phone: string | null
  relationship_status: string
  is_beta_applicant: boolean
  privacy_consent?: boolean
}
