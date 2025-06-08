export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // Removed saju_profiles, chat_rooms, and user_saju_info tables
      saju_interpretations: {
        Row: {
          id: string
          user_id: string
          basic_interpretation: string
          model_used: string
          response_time: string
          user_feedback: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          basic_interpretation: string
          model_used: string
          response_time: string
          user_feedback?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          basic_interpretation?: string
          model_used?: string
          response_time?: string
          user_feedback?: string | null
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
