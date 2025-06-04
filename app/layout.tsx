import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client"

// 메타데이터 제목과 설명을 변경합니다

export const metadata: Metadata = {
  title: "사주핑 – 무속의 맛, 알고리즘의 향",
  description: "사주핑 – 무속의 맛, 알고리즘의 향",
  metadataBase: new URL("https://sajuping.ai"),
  openGraph: {
    title: "사주핑 – 무속의 맛, 알고리즘의 향",
    description: "사주핑 – 무속의 맛, 알고리즘의 향",
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
    title: "사주핑 – 무속의 맛, 알고리즘의 향",
    description: "사주핑 – 무속의 맛, 알고리즘의 향",
    images: [
      "https://kuzwrrihvbbwliuotead.supabase.co/storage/v1/object/sign/sajuping/sajuping_character.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzYWp1cGluZy9zYWp1cGluZ19jaGFyYWN0ZXIucG5nIiwiaWF0IjoxNzQzMDUwOTI0LCJleHAiOjE4Mzc2NTg5MjR9.QPkgNVnK9onLyzlseM_9f0YuDsrwwjKhOOwFFAb6B0A",
    ],
  },
  verification: {
    other: {
      "naver-site-verification": ["51500e7d49fe759a7c2eec8ca177fea25c602782"],
    },
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
