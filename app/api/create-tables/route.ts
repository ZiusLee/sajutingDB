import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials not found" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // user_coins 테이블 생성
    const { error: coinsError } = await supabase.rpc("create_user_coins_table")

    if (coinsError) {
      console.error("Error creating user_coins table:", coinsError)
      return NextResponse.json({ error: coinsError.message }, { status: 500 })
    }

    // user_talismans 테이블 생성
    const { error: talismansError } = await supabase.rpc("create_user_talismans_table")

    if (talismansError) {
      console.error("Error creating user_talismans table:", talismansError)
      return NextResponse.json({ error: talismansError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tables created successfully" })
  } catch (error) {
    console.error("Error creating tables:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
