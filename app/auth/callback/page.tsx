import { Suspense } from 'react'
import AuthCallbackContent from './auth-callback-content'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">인증 처리 중...</h1>
          <p className="text-white/80">잠시만 기다려주세요</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
