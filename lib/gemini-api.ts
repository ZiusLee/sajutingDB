interface GeminiMessage {
  role: "user" | "model"
  parts: { text: string }[]
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[]
    }
  }[]
  promptFeedback?: any
}

export async function generateGeminiResponse(messages: GeminiMessage[]): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gemini API error:", errorData)
      throw new Error(`Gemini API error: ${errorData.error?.message || "Unknown error"}`)
    }

    const data = (await response.json()) as GeminiResponse

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API")
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error("Error generating Gemini response:", error)
    throw error
  }
}

export async function streamGeminiResponse(messages: GeminiMessage[]): Promise<ReadableStream> {
  // Create a TransformStream to convert the Gemini response to a format compatible with AI SDK
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const transformStream = new TransformStream({
    async start(controller) {
      try {
        // Get the full response from Gemini (non-streaming for now)
        const fullResponse = await generateGeminiResponse(messages)

        // Simulate streaming by sending chunks of the response
        const chunks = fullResponse.match(/.{1,20}/g) || []

        for (const chunk of chunks) {
          const data = {
            type: "text",
            text: chunk,
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          await new Promise((resolve) => setTimeout(resolve, 50)) // Simulate delay between chunks
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.terminate()
      } catch (error) {
        console.error("Error in streamGeminiResponse:", error)
        controller.error(error)
      }
    },
  })

  return transformStream.readable
}

// Convert AI SDK messages format to Gemini format
export function convertToGeminiMessages(aiMessages: any[]): GeminiMessage[] {
  return aiMessages.map((msg) => {
    // Skip system messages as Gemini doesn't support them directly
    if (msg.role === "system") {
      return {
        role: "user",
        parts: [{ text: `[System Instruction]: ${msg.content}` }],
      }
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }
  })
}
