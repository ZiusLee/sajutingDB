import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 클라이언트 키는 공개되어도 되는 키이지만 서버에서 제공
    const clientKey = process.env.TOSS_PAYMENTS_CLIENT_KEY

    if (!clientKey) {
      return NextResponse.json({ error: "Client key not configured" }, { status: 500 })
    }

    return NextResponse.json({ clientKey })
  } catch (error) {
    console.error("Error getting client key:", error)
    return NextResponse.json({ error: "Failed to get client key" }, { status: 500 })
  }
}
