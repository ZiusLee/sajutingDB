"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerLabel: string
  onAgree: () => void
}

export function TermsDialog({ open, onOpenChange, providerLabel, onAgree }: TermsDialogProps) {
  const [age, setAge] = React.useState(false)
  const [tos, setTos] = React.useState(false)
  const [privacy, setPrivacy] = React.useState(false)
  const allChecked = age && tos && privacy

  const setAll = (val: boolean) => {
    setAge(val)
    setTos(val)
    setPrivacy(val)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">약관 동의</DialogTitle>
          <DialogDescription>{providerLabel} 로그인을 계속하시려면 아래 약관에 동의해주세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
            <Checkbox id="all" checked={allChecked} onCheckedChange={(v) => setAll(Boolean(v))} />
            <label htmlFor="all" className="text-sm font-medium leading-none cursor-pointer">
              전체 동의
            </label>
          </div>

          <div className="space-y-3">
            <CheckboxRow id="age" checked={age} onChange={setAge} label="만 14세 이상입니다 (필수)" />
            <CheckboxRow id="tos" checked={tos} onChange={setTos} label="서비스 이용약관 동의 (필수)" />
            <CheckboxRow id="privacy" checked={privacy} onChange={setPrivacy} label="개인정보 처리방침 동의 (필수)" />
          </div>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms">서비스 이용약관</TabsTrigger>
              <TabsTrigger value="privacy">개인정보 처리방침</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="mt-4">
              <div className="rounded-md border">
                <ScrollArea className="h-60 p-4">
                  <div className="space-y-4 text-sm">
                    <h3 className="font-semibold text-base">서비스 이용약관</h3>

                    <div>
                      <h4 className="font-medium mb-2">제1조 (목적)</h4>
                      <p className="text-muted-foreground">
                        이 약관은 사주핑(이하 "회사")이 제공하는 사주 해석 서비스의 이용조건 및 절차, 회사와 이용자의
                        권리, 의무, 책임사항을 규정함을 목적으로 합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">제2조 (정의)</h4>
                      <p className="text-muted-foreground">
                        1. "서비스"란 회사가 제공하는 사주 해석, 운세 상담 등의 모든 서비스를 의미합니다.
                        <br />
                        2. "이용자"란 이 약관에 따라 회사의 서비스를 받는 회원 및 비회원을 말합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">제3조 (약관의 효력 및 변경)</h4>
                      <p className="text-muted-foreground">
                        1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
                        <br />
                        2. 회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해
                        공지합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">제4조 (서비스의 제공)</h4>
                      <p className="text-muted-foreground">
                        회사는 이용자에게 사주 해석, 운세 상담, 궁합 분석 등의 서비스를 제공합니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">제5조 (이용자의 의무)</h4>
                      <p className="text-muted-foreground">
                        1. 이용자는 정확한 정보를 제공해야 합니다.
                        <br />
                        2. 이용자는 서비스를 건전한 목적으로만 이용해야 합니다.
                        <br />
                        3. 이용자는 타인의 권리를 침해하거나 불법적인 행위를 해서는 안 됩니다.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="mt-4">
              <div className="rounded-md border">
                <ScrollArea className="h-60 p-4">
                  <div className="space-y-4 text-sm">
                    <h3 className="font-semibold text-base">개인정보 처리방침</h3>

                    <div>
                      <h4 className="font-medium mb-2">1. 개인정보의 처리 목적</h4>
                      <p className="text-muted-foreground">
                        사주핑은 다음의 목적을 위하여 개인정보를 처리합니다.
                        <br />- 회원 가입 및 관리
                        <br />- 사주 해석 서비스 제공
                        <br />- 고객 상담 및 불만 처리
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">2. 개인정보의 처리 및 보유 기간</h4>
                      <p className="text-muted-foreground">
                        - 회원 탈퇴 시까지 보유
                        <br />- 관련 법령에 따른 보존 의무가 있는 경우 해당 기간까지 보유
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">3. 개인정보의 제3자 제공</h4>
                      <p className="text-muted-foreground">
                        회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">4. 개인정보 처리의 위탁</h4>
                      <p className="text-muted-foreground">
                        회사는 서비스 향상을 위해 개인정보 처리업무를 외부 전문업체에 위탁할 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">5. 정보주체의 권리·의무 및 행사방법</h4>
                      <p className="text-muted-foreground">
                        이용자는 개인정보 열람, 정정·삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">6. 개인정보의 안전성 확보조치</h4>
                      <p className="text-muted-foreground">
                        회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                        <br />- 관리적 조치: 내부관리계획 수립·시행
                        <br />- 기술적 조치: 개인정보처리시스템 등의 접근권한 관리
                        <br />- 물리적 조치: 전산실, 자료보관실 등의 접근통제
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">7. 개인정보 보호책임자</h4>
                      <p className="text-muted-foreground">
                        성명: 사주핑 개인정보보호팀
                        <br />
                        연락처: privacy@sajuping.com
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-muted-foreground">본 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.</p>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onAgree} disabled={!allChecked}>
            동의하고 계속
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CheckboxRow({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (val: boolean) => void
  label: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <label htmlFor={id} className="text-sm leading-none cursor-pointer">
        {label}
      </label>
    </div>
  )
}
