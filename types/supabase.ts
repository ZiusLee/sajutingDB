export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<Public extends boolean = false> = Public extends true ? never : Database["public"]["Tables"]
export type Views<Public extends boolean = false> = Public extends true ? never : Database["public"]["Views"]
export type Functions<Public extends boolean = false> = Public extends true ? never : Database["public"]["Functions"]
