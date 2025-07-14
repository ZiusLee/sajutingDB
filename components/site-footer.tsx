import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">사주팅</h3>
            <p className="text-sm text-muted-foreground">AI와 함께하는 스마트한 사주 상담 서비스</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  사주 보기
                </Link>
              </li>
              <li>
                <Link href="/compatibility" className="text-muted-foreground hover:text-foreground">
                  궁합 보기
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">법적 고지</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 사주팅. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
