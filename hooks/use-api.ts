"use client"

import { useState } from "react"

interface ApiOptions<T> {
  url: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: T
  params?: Record<string, string>
}

export function useApi<T, R>() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<R | null>(null)

  const callApi = async ({ url, method = "GET", body, params }: ApiOptions<T>): Promise<R | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // URL 파라미터 추가
      let apiUrl = url
      if (params) {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value)
        })
        apiUrl = `${url}?${searchParams.toString()}`
      }

      // API 요청 옵션 설정
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      // POST, PUT 요청인 경우 body 추가
      if (body && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(body)
      }

      // API 요청 실행
      const response = await fetch(apiUrl, options)
      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "API 요청 중 오류가 발생했습니다.")
      }

      setData(responseData)
      return responseData
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { callApi, isLoading, error, data }
}
