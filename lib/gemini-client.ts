import { GoogleGenerativeAI } from "@google/generative-ai"

const MODEL_NAME = "gemini-pro"
const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY"

async function streamGeminiText(messages: any, systemPrompt: string, temperature: number, maxOutputTokens: number) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const chat = model.startChat({
      history: messages,
      generationConfig: {
        maxOutputTokens: maxOutputTokens,
        temperature: temperature,
      },
      systemInstruction: systemPrompt,
    })

    const result = await chat.sendMessageStream(messages[messages.length - 1].content)
    return result.stream
  } catch (error) {
    console.error("Error in streamGeminiText:", error)
    throw error
  }
}

async function generateGeminiText(messages: any, systemPrompt: string, temperature: number, maxOutputTokens: number) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const chat = model.startChat({
      history: messages,
      generationConfig: {
        maxOutputTokens: maxOutputTokens,
        temperature: temperature,
      },
      systemInstruction: systemPrompt,
    })

    const msg = messages[messages.length - 1].content
    const result = await chat.sendMessage(msg)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error("Error in generateGeminiText:", error)
    throw error
  }
}

export { streamGeminiText, generateGeminiText }
