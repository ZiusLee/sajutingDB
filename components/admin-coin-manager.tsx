"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function AdminCoinManager() {
  const [email, setEmail] = useState("yoonslee@utexas.edu")
  const [amount, setAmount] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/manage-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, amount }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || `${email} 사용자에게 ${amount}질문권이 추가되었습니다.`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "질문권 추가 중 오류가 발생했습니다.",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "요청 처리 중 오류가 발생했습니다.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>사용자 질문권 관리</CardTitle>
        <CardDescription>특정 사용자에게 질문권을 추가합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">사용자 이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="사용자 이메일 주소"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">질문권 수량</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number.parseInt(e.target.value))}
              min={1}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "처리 중..." : "질문권 추가하기"}
          </Button>
        </form>
      </CardContent>
      {result && (
        <CardFooter>
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "성공" : "오류"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}
