"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>약관 및 정책</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terms">서비스 이용약관</TabsTrigger>
            <TabsTrigger value="privacy">개인정보 처리방침</TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">서비스 이용약관</h3>

                <div className="space-y-3">
                  <h4 className="font-medium">제1조 (목적)</h4>
                  <p className="text-sm text-muted-foreground">
                    이 약관은 사주핑(이하 "회사")이 제공하는 사주 해석 서비스(이하 "서비스")의 이용조건 및 절차, 회사와
                    이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
                  </p>

                  <h4 className="font-medium">제2조 (정의)</h4>
                  <p className="text-sm text-muted-foreground">
                    1. "서비스"란 회사가 제공하는 사주 해석 및 관련 서비스를 의미합니다.
                    <br />
                    2. "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
                    <br />
                    3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며,
                    회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
                  </p>

                  <h4 className="font-medium">제3조 (약관의 효력 및 변경)</h4>
                  <p className="text-sm text-muted-foreground">
                    1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
                    <br />
                    2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을
                    통해 공지합니다.
                  </p>

                  <h4 className="font-medium">제4조 (서비스의 제공)</h4>
                  <p className="text-sm text-muted-foreground">
                    1. 회사는 이용자에게 사주 해석 서비스를 제공합니다.
                    <br />
                    2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
                    <br />
                    3. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는
                    서비스의 제공을 일시적으로 중단할 수 있습니다.
                  </p>

                  <h4 className="font-medium">제5조 (이용자의 의무)</h4>
                  <p className="text-sm text-muted-foreground">
                    1. 이용자는 서비스 이용 시 관계법령과 이 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항을
                    준수하여야 합니다.
                    <br />
                    2. 이용자는 회사의 사전 승낙 없이는 서비스를 이용하여 영업활동을 할 수 없으며, 그 영업활동의 결과에
                    대해 회사는 책임을 지지 않습니다.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="privacy">
            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">개인정보 처리방침</h3>

                <div className="space-y-3">
                  <h4 className="font-medium">1. 개인정보의 처리 목적</h4>
                  <p className="text-sm text-muted-foreground">
                    사주핑은 다음의 목적을 위하여 개인정보를 처리합니다.
                    <br />- 회원 가입 및 관리
                    <br />- 사주 해석 서비스 제공
                    <br />- 고객 상담 및 불만 처리
                  </p>

                  <h4 className="font-medium">2. 개인정보의 처리 및 보유 기간</h4>
                  <p className="text-sm text-muted-foreground">
                    - 회원 탈퇴 시까지 보유
                    <br />- 관련 법령에 따른 보존 의무가 있는 경우 해당 기간까지 보유
                  </p>

                  <h4 className="font-medium">3. 개인정보의 제3자 제공</h4>
                  <p className="text-sm text-muted-foreground">
                    회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                  </p>

                  <h4 className="font-medium">4. 개인정보 처리의 위탁</h4>
                  <p className="text-sm text-muted-foreground">
                    회사는 서비스 향상을 위해 개인정보 처리업무를 외부 전문업체에 위탁할 수 있습니다.
                  </p>

                  <h4 className="font-medium">5. 정보주체의 권리·의무 및 행사방법</h4>
                  <p className="text-sm text-muted-foreground">
                    이용자는 개인정보 열람, 정정·삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.
                  </p>

                  <h4 className="font-medium">6. 개인정보의 안전성 확보조치</h4>
                  <p className="text-sm text-muted-foreground">
                    회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                    <br />- 관리적 조치: 내부관리계획 수립·시행
                    <br />- 기술적 조치: 개인정보처리시스템 등의 접근권한 관리
                    <br />- 물리적 조치: 전산실, 자료보관실 등의 접근통제
                  </p>

                  <h4 className="font-medium">7. 개인정보 보호책임자</h4>
                  <p className="text-sm text-muted-foreground">
                    성명: 사주핑 개인정보보호팀
                    <br />
                    연락처: privacy@sajuping.com
                  </p>

                  <p className="text-sm text-muted-foreground mt-4">
                    본 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
