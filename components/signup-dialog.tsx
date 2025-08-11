"use client"

import { useState } from "react"
import { Button } from "@chakra-ui/react"
import { supabase } from "../supabaseClient"
import { toast } from "react-toastify"
import { MessageCircle, Chrome, Apple } from "lucide-react"

const SignupDialog = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleSocialLogin = async (provider: "kakao" | "google" | "apple") => {
    console.log(`Starting ${provider} login...`)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider === "kakao" ? "kakao" : provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(provider === "google" && {
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          }),
        },
      })

      if (error) {
        console.error(`${provider} login error:`, error)
        toast({
          title: "로그인 실패",
          description: `${provider} 로그인 중 오류가 발생했습니다: ${error.message}`,
          variant: "destructive",
        })
      } else {
        console.log(`${provider} login initiated successfully`)
      }
    } catch (err) {
      console.error(`${provider} login exception:`, err)
      toast({
        title: "로그인 실패",
        description: "로그인 중 예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        className="flex-1 h-12 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
        onClick={() => handleSocialLogin("kakao")}
        disabled={isLoading}
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        카카오
      </Button>

      <Button
        variant="outline"
        className="flex-1 h-12 bg-transparent"
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading}
      >
        <Chrome className="w-5 h-5 mr-2 text-blue-500" />
        구글
      </Button>

      <Button
        variant="outline"
        className="flex-1 h-12 bg-transparent"
        onClick={() => handleSocialLogin("apple")}
        disabled={isLoading}
      >
        <Apple className="w-5 h-5 mr-2" />
        애플
      </Button>
    </div>
  )
}

export default SignupDialog
