import { NextResponse } from "next/server"

// Server-side proxy for OpenAI embeddings to avoid CORS issues
export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid text parameter" },
        { status: 400 }
      )
    }

    // Ensure API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return NextResponse.json(
        { error: "Embedding service not configured" },
        { status: 500 }
      )
    }

    // Truncate text to avoid token limits
    const truncatedText = text.slice(0, 8000)

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: truncatedText,
        dimensions: 1536,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("OpenAI API error:", error)
      return NextResponse.json(
        { error: "Failed to generate embedding", details: error },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      embedding: data.data[0].embedding,
      model: data.model,
      usage: data.usage,
    })
  } catch (error) {
    console.error("Embedding API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
