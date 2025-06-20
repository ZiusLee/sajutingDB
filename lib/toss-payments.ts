// Toss Payments 설정
export const TOSS_PAYMENTS_CONFIG = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY!,
  secretKey: process.env.TOSS_PAYMENTS_SECRET_KEY!,
  successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
  failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`,
}

// 코인 패키지 정의
export const COIN_PACKAGES = [
  {
    id: "basic",
    name: "기본 패키지",
    coins: 50,
    price: 5000,
    description: "50핑 충전",
    popular: false,
  },
  {
    id: "standard",
    name: "인기 패키지",
    coins: 120,
    price: 10000,
    description: "120핑 충전 (20핑 보너스)",
    popular: true,
  },
  {
    id: "premium",
    name: "프리미엄 패키지",
    coins: 300,
    price: 20000,
    description: "300핑 충전 (80핑 보너스)",
    popular: false,
  },
]

export interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName?: string
  customerEmail?: string
}
