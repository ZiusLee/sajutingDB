import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    console.log("[v0] Starting user coins migration...")

    // First, check how many users don't have user_coins records
    const { data: usersWithoutCoins, error: checkError } = await supabase
      .from("auth.users")
      .select(`
        id,
        email,
        user_coins!left(user_id)
      `)
      .is("user_coins.user_id", null)

    if (checkError) {
      console.error("[v0] Error checking users without coins:", checkError)
      return NextResponse.json({ error: "Failed to check users" }, { status: 500 })
    }

    console.log(`[v0] Found ${usersWithoutCoins?.length || 0} users without coins`)

    if (!usersWithoutCoins || usersWithoutCoins.length === 0) {
      return NextResponse.json({
        message: "All users already have coins",
        migrated: 0,
      })
    }

    // Create user_coins records for users who don't have them
    const newUserCoins = usersWithoutCoins.map((user) => ({
      user_id: user.id,
      coins: 3,
      subscription_plan: "free",
      last_daily_charge: new Date().toISOString().split("T")[0], // Today's date
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data: insertedCoins, error: insertError } = await supabase.from("user_coins").insert(newUserCoins).select()

    if (insertError) {
      console.error("[v0] Error inserting user coins:", insertError)
      return NextResponse.json({ error: "Failed to create user coins" }, { status: 500 })
    }

    console.log(`[v0] Successfully migrated ${insertedCoins?.length || 0} users`)

    // Get final statistics
    const { data: stats, error: statsError } = await supabase.from("user_coins").select("subscription_plan, coins")

    let breakdown = {}
    if (stats && !statsError) {
      breakdown = stats.reduce((acc: any, user: any) => {
        const plan = user.subscription_plan || "unknown"
        if (!acc[plan]) {
          acc[plan] = { count: 0, totalCoins: 0 }
        }
        acc[plan].count++
        acc[plan].totalCoins += user.coins
        return acc
      }, {})
    }

    return NextResponse.json({
      message: "Migration completed successfully",
      migrated: insertedCoins?.length || 0,
      breakdown,
    })
  } catch (error) {
    console.error("[v0] Migration error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Count total users
    const { count: totalUsers, error: userError } = await supabase
      .from("auth.users")
      .select("*", { count: "exact", head: true })

    // Count users with coins
    const { count: usersWithCoins, error: coinsError } = await supabase
      .from("user_coins")
      .select("*", { count: "exact", head: true })

    if (userError || coinsError) {
      return NextResponse.json({ error: "Failed to get counts" }, { status: 500 })
    }

    // Get breakdown by subscription plan
    const { data: breakdown, error: breakdownError } = await supabase
      .from("user_coins")
      .select("subscription_plan, coins")

    let planBreakdown = {}
    if (breakdown && !breakdownError) {
      planBreakdown = breakdown.reduce((acc: any, user: any) => {
        const plan = user.subscription_plan || "unknown"
        if (!acc[plan]) {
          acc[plan] = { count: 0, totalCoins: 0, avgCoins: 0 }
        }
        acc[plan].count++
        acc[plan].totalCoins += user.coins
        acc[plan].avgCoins = acc[plan].totalCoins / acc[plan].count
        return acc
      }, {})
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      usersWithCoins: usersWithCoins || 0,
      usersWithoutCoins: (totalUsers || 0) - (usersWithCoins || 0),
      planBreakdown,
    })
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json(
      {
        error: "Status check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
