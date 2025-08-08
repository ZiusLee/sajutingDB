import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import ClientLayout from "./client-layout"
import AnalyticsWrapper from "@/components/analytics-wrapper"
import { GoogleAnalytics } from '@next/third-parties/google'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "사주핑 - AI 사주 분석 서비스",
  description: "AI가 분석하는 정확한 사주 운세. 사주팔자, 궁합, 대운, 오늘의 운세를 확인해보세요.",
  keywords: "사주, 사주팔자, 운세, 궁합, 대운, AI 사주, 사주 분석",
  authors: [{ name: "사주핑" }],
  creator: "사주핑",
  publisher: "사주핑",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sajuping.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "사주핑 - AI 사주 분석 서비스",
    description: "AI가 분석하는 정확한 사주 운세. 사주팔자, 궁합, 대운, 오늘의 운세를 확인해보세요.",
    url: 'https://sajuping.com',
    siteName: '사주핑',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/sajuping-logo.png',
        width: 1200,
        height: 630,
        alt: '사주핑 로고',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "사주핑 - AI 사주 분석 서비스",
    description: "AI가 분석하는 정확한 사주 운세. 사주팔자, 궁합, 대운, 오늘의 운세를 확인해보세요.",
    images: ['/images/sajuping-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google39c650a5648e2b2d',
    other: {
      'naver-site-verification': 'naverd0ceb7b213e6ca7ce0f7076be36f2075',
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/sajuping-logo.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="사주핑" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ChatProvider>
              <AnalyticsWrapper>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </AnalyticsWrapper>
              <Toaster />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-YFCCKXZDEN" />
      </body>
    </html>
  )
}
