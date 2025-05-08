export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      saju_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          birth_date: string
          birth_time: string
          gender: string
          created_at: string
          // Add other fields as needed
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          birth_date: string
          birth_time: string
          gender: string
          created_at?: string
          // Add other fields as needed
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          birth_date?: string
          birth_time?: string
          gender?: string
          created_at?: string
          // Add other fields as needed
        }
      }
      saju_interpretations: {
        Row: {
          id: string
          user_id: string
          basic_interpretation: string
          model_used: string
          response_time: string
          user_feedback: string | null // 피드백 필드 추가
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          basic_interpretation: string
          model_used: string
          response_time: string
          user_feedback?: string | null // 피드백 필드 추가
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          basic_interpretation?: string
          model_used?: string
          response_time?: string
          user_feedback?: string | null // 피드백 필드 추가
          created_at?: string
          updated_at?: string | null
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
      chat_rooms: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          room_type: string
          last_message: string | null
          last_message_time: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          room_type: string
          last_message?: string | null
          last_message_time?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          room_type?: string
          last_message?: string | null
          last_message_time?: string | null
          created_at?: string
          updated_at?: string | null
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
          daeun_age: number | null
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
          daeun_age?: number | null
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
          daeun_age?: number | null
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
