import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import ClientLayout from "./client-layout"
import AnalyticsWrapper from "@/components/analytics-wrapper"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Suspense } from "react"

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
  metadataBase: new URL("https://sajuping.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "사주핑 - AI 사주 분석 서비스",
    description: "AI가 분석하는 정확한 사주 운세. 사주팔자, 궁합, 대운, 오늘의 운세를 확인해보세요.",
    url: "https://sajuping.com",
    siteName: "사주핑",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/images/sajuping-logo.png",
        width: 1200,
        height: 630,
        alt: "사주핑 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "사주핑 - AI 사주 분석 서비스",
    description: "AI가 분석하는 정확한 사주 운세. 사주팔자, 궁합, 대운, 오늘의 운세를 확인해보세요.",
    images: ["/images/sajuping-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google39c650a5648e2b2d",
    other: {
      "naver-site-verification": "naverd0ceb7b213e6ca7ce0f7076be36f2075",
    },
  },
    generator: 'v0.app'
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              window.addEventListener('load', function() {
                setTimeout(function() {
                  const perfData = performance.getEntriesByType('navigation')[0];
                  if (perfData && perfData.loadEventEnd - perfData.navigationStart > 5000) {
                    if (window.gtag) {
                      gtag('event', 'PERFORMANCE_page_load_slow', {
                        'load_time': perfData.loadEventEnd - perfData.navigationStart,
                        'page_url': window.location.pathname
                      });
                    }
                  }
                }, 1000);
              });

              // Scroll depth tracking
              let maxScroll = 0;
              window.addEventListener('scroll', function() {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                if (scrollPercent > maxScroll) {
                  maxScroll = scrollPercent;
                  if (maxScroll >= 75 && window.gtag) {
                    gtag('event', 'BEHAVIOR_scroll_depth_75', {
                      'scroll_depth': maxScroll,
                      'page_url': window.location.pathname
                    });
                  }
                }
              });

              // Time on page tracking
              let startTime = Date.now();
              window.addEventListener('beforeunload', function() {
                const timeOnPage = Date.now() - startTime;
                if (timeOnPage > 300000 && window.gtag) { // 5 minutes
                  gtag('event', 'BEHAVIOR_time_on_page_5min', {
                    'time_on_page': timeOnPage,
                    'page_url': window.location.pathname
                  });
                }
              });

              !function(){"use strict";!function(e,t){var r=e.amplitude||{_q:[],_iq:{}};if(r.invoked)e.console&&console.error&&console.error("Amplitude snippet has been loaded.");else{var n=function(e,t){e.prototype[t]=function(){return this._q.push({name:t,args:Array.prototype.slice.call(arguments,0)}),this}},s=function(e,t,r){return function(n){e._q.push({name:t,args:Array.prototype.slice.call(r,0),resolve:n})}},o=function(e,t,r){e[t]=function(){if(r)return{promise:new Promise(s(e,t,Array.prototype.slice.call(arguments)))}}},i=function(e){for(var t=0;t<m.length;t++)o(e,m[t],!1);for(var r=0;r<y.length;r++)o(e,y[r],!0)};r.invoked=!0;var a=t.createElement("script");a.type="text/javascript",a.crossOrigin="anonymous",a.src="https://cdn.amplitude.com/libs/plugin-ga-events-forwarder-browser-0.4.2-min.js.gz",a.onload=function(){e.gaEventsForwarder&&e.gaEventsForwarder.plugin&&e.amplitude.add(e.gaEventsForwarder.plugin())};var c=t.createElement("script");c.type="text/javascript",c.integrity="sha384-pY2pkwHaLM/6UIseFHVU3hOKr6oAvhLcdYkoRZyaMDWLjpM6B7nTxtOdE823WAOQ",c.crossOrigin="anonymous",c.async=!0,c.src="https://cdn.amplitude.com/libs/analytics-browser-2.11.0-min.js.gz",c.onload=function(){e.amplitude.runQueuedFunctions||console.log("[Amplitude] Error: could not load SDK")};var u=t.getElementsByTagName("script")[0];u.parentNode.insertBefore(a,u),u.parentNode.insertBefore(c,u);for(var p=function(){return this._q=[],this},d=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove","getUserProperties"],l=0;l<d.length;l++)n(p,d[l]);r.Identify=p;for(var g=function(){return this._q=[],this},v=["getEventProperties","setProductId","setQuantity","setPrice","setRevenue","setRevenueType","setEventProperties"],f=0;f<v.length;f++)n(g,v[f]);r.Revenue=g;var m=["getDeviceId","setDeviceId","getSessionId","setSessionId","getUserId","setUserId","setOptOut","setTransport","reset","extendSession"],y=["init","add","remove","track","logEvent","identify","groupIdentify","setGroup","revenue","flush"];i(r),r.createInstance=function(e){return r._iq[e]={_q:[]},i(r._iq[e]),r._iq[e]},e.amplitude=r}}(window,document)}();
              amplitude.init('55aa25ef88f71d8ad3a88429c488c7fe');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ChatProvider>
              <AnalyticsWrapper>
                <Suspense fallback={<div className="min-h-screen bg-background" />}>
                  <ClientLayout>{children}</ClientLayout>
                </Suspense>
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
