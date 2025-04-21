// Gemini API client for streaming text responses
export async function streamGeminiText(messages: any[], systemPrompt: string, temperature = 0.7, maxTokens = 4000) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined")
  }

  // Format messages for Gemini API
  const formattedMessages = formatMessagesForGemini(messages, systemPrompt)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedMessages,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
            topK: 40,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", response.status, errorText) // Log the error
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    return response
  } catch (error) {
    console.error("Error calling streamGeminiText:", error)
    throw error
  }
}

// Non-streaming Gemini text generation
export async function generateGeminiText(messages: any[], systemPrompt: string, temperature = 0.7, maxTokens = 4000) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined")
  }

  // Format messages for Gemini API
  const formattedMessages = formatMessagesForGemini(messages, systemPrompt)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedMessages,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
            topK: 40,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", response.status, errorText) // Log the error
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    // Extract text from Gemini response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      let fullText = ""
      for (const part of data.candidates[0].content.parts) {
        if (part.text) {
          fullText += part.text
        }
      }
      return fullText
    }

    throw new Error("No text content found in Gemini response")
  } catch (error) {
    console.error("Error calling generateGeminiText:", error)
    throw error
  }
}

// Format messages for Gemini API
function formatMessagesForGemini(messages: any[], systemPrompt: string) {
  const formattedMessages = []

  // Add system message as a "model" role
  if (systemPrompt) {
    formattedMessages.push({
      role: "model",
      parts: [{ text: systemPrompt }],
    })
  }

  // Add user and assistant messages
  for (const message of messages) {
    if (message.role === "system") continue // Skip system messages as we've handled them

    const role = message.role === "user" ? "user" : "model"
    formattedMessages.push({
      role: role,
      parts: [{ text: message.content }],
    })
  }

  return formattedMessages
}

// Convert Gemini stream to text stream
export async function* geminiStreamToTextStream(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error("Response body is null")

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete JSON objects from the buffer
      let startPos = 0
      while (startPos < buffer.length) {
        // Find the next JSON object
        const jsonStart = buffer.indexOf("{", startPos)
        if (jsonStart === -1) break

        try {
          // Try to parse a complete JSON object
          const jsonEnd = findJsonEnd(buffer, jsonStart)
          if (jsonEnd === -1) break

          const jsonStr = buffer.substring(jsonStart, jsonEnd + 1)
          const data = JSON.parse(jsonStr)

          // Extract text content from Gemini response
          if (data.candidates && data.candidates[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
              if (part.text) {
                yield part.text
              }
            }
          }

          startPos = jsonEnd + 1
        } catch (e) {
          // If parsing fails, check if it's an HTML document
          if (buffer.startsWith("<!DOCTYPE html>")) {
            console.warn("Received HTML response from Gemini API, stopping stream")
            yield "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
            return // Stop the stream
          }
          // If parsing fails, we need more data
          break
        }
      }

      // Remove processed data from buffer
      if (startPos > 0) {
        buffer = buffer.substring(startPos)
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// Helper function to find the end of a JSON object
function findJsonEnd(str: string, startPos: number): number {
  let depth = 0
  let inString = false
  let escape = false

  for (let i = startPos; i < str.length; i++) {
    const char = str[i]

    if (inString) {
      if (escape) {
        escape = false
      } else if (char === "\\") {
        escape = true
      } else if (char === '"') {
        inString = false
      }
    } else {
      if (char === '"') {
        inString = true
      } else if (char === "{") {
        depth++
      } else if (char === "}") {
        depth--
        if (depth === 0) {
          return i
        }
      }
    }
  }

  return -1 // Incomplete JSON
}
