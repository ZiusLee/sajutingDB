import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client"

export const metadata: Metadata = {
  title: "사주핑 - AI 사주로 보는 애정운",
  description: "명리학 기반 정밀분석 사주팔자",
  metadataBase: new URL("https://sajuping.ai"),
  openGraph: {
    title: "사주핑 - AI 사주로 보는 애정운",
    description: "명리학 기반 정밀분석 사주팔자",
    url: "https://sajuping.ai",
    siteName: "사주핑",
    images: [
      {
        url: "https://kuzwrrihvbbwliuotead.supabase.co/storage/v1/object/sign/sajuping/sajuping_character.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzYWp1cGluZy9zYWp1cGluZ19jaGFyYWN0ZXIucG5nIiwiaWF0IjoxNzQzMDUwOTI0LCJleHAiOjE4Mzc2NTg5MjR9.QPkgNVnK9onLyzlseM_9f0YuDsrwwjKhOOwFFAb6B0A",
        width: 800,
        height: 800,
        alt: "사주핑 캐릭터",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "사주핑 - AI 사주로 보는 애정운",
    description: "명리학 기반 정밀분석 사주팔자",
    images: [
      "https://kuzwrrihvbbwliuotead.supabase.co/storage/v1/object/sign/sajuping/sajuping_character.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzYWp1cGluZy9zYWp1cGluZ19jaGFyYWN0ZXIucG5nIiwiaWF0IjoxNzQzMDUwOTI0LCJleHAiOjE4Mzc2NTg5MjR9.QPkgNVnK9onLyzlseM_9f0YuDsrwwjKhOOwFFAb6B0A",
    ],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}


import './globals.css'