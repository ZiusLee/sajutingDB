import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  console.log("=== 테스트 API 호출됨 ===")

  try {
    const body = await req.json()
    console.log("요청 데이터:", body)

    return NextResponse.json({
      success: true,
      message: "테스트 API 정상 작동",
      receivedData: body,
    })
  } catch (error) {
    console.error("테스트 API 오류:", error)
    return NextResponse.json(
      {
        success: false,
        message: "테스트 API 오류",
      },
      { status: 500 },
    )
  }
}
