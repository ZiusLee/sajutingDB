"use client"

import type * as React from "react"
import { useState } from "react"
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
import Link from "next/link"

export interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerLabel: string
  onAgree: () => void
}

export function TermsDialog({ open, onOpenChange, providerLabel, onAgree }: TermsDialogProps) {
  const [age, setAge] = useState(false)
  const [tos, setTos] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)
  const allChecked = age && tos && privacy

  const setAll = (val: boolean) => {
    setAge(val)
    setTos(val)
    setPrivacy(val)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
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
            <CheckboxRow
              id="tos"
              checked={tos}
              onChange={setTos}
              label={
                <>
                  서비스 이용약관 동의 (필수){" "}
                  <Link className="underline underline-offset-4" href="/terms" prefetch={false}>
                    자세히
                  </Link>
                </>
              }
            />
            <CheckboxRow
              id="privacy"
              checked={privacy}
              onChange={setPrivacy}
              label={
                <>
                  개인정보 처리방침 동의 (필수){" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPrivacyDetails(true)
                    }}
                  >
                    자세히
                  </button>
                </>
              }
            />
          </div>

          <div className="rounded-md border">
            <ScrollArea className="h-40 p-4 text-sm text-muted-foreground">
              사주핑 서비스 이용을 위해 필요한 기본 약관 요약입니다. 상세 전문은 상단 링크에서 확인하실 수 있습니다.
              수집 항목: 인증용 식별자, 이메일, 프로필 정보 등. 수집 목적: 계정 연동, 맞춤형 서비스 제공, 고객 지원.
              보관 기간: 회원 탈퇴 시 혹은 관련 법령에 따름.
            </ScrollArea>
          </div>
        </div>

        {showPrivacyDetails && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">개인정보 처리방침</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPrivacyDetails(false)}>
                    ✕
                  </Button>
                </div>
              </div>
              <ScrollArea className="p-6 max-h-[60vh]">
                <div className="space-y-4 text-sm">
                  <section>
                    <h4 className="font-semibold mb-2">1. 개인정보의 처리 목적</h4>
                    <p className="text-gray-600 mb-2">사주핑은 다음의 목적을 위하여 개인정보를 처리합니다.</p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>회원 가입 및 관리</li>
                      <li>사주 해석 서비스 제공</li>
                      <li>고객 상담 및 불만 처리</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">2. 개인정보의 처리 및 보유 기간</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>회원 탈퇴 시까지 보유</li>
                      <li>관련 법령에 따른 보존 의무가 있는 경우 해당 기간까지 보유</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">3. 개인정보의 제3자 제공</h4>
                    <p className="text-gray-600">회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">4. 개인정보 처리의 위탁</h4>
                    <p className="text-gray-600">
                      회사는 서비스 향상을 위해 개인정보 처리업무를 외부 전문업체에 위탁할 수 있습니다.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">5. 정보주체의 권리·의무 및 행사방법</h4>
                    <p className="text-gray-600">
                      이용자는 개인정보 열람, 정정·삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.
                    </p>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">6. 개인정보의 안전성 확보조치</h4>
                    <p className="text-gray-600 mb-2">
                      회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>관리적 조치: 내부관리계획 수립·시행</li>
                      <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리</li>
                      <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">7. 개인정보 보호책임자</h4>
                    <ul className="list-none space-y-1 text-gray-600">
                      <li>성명: 사주핑 개인정보보호팀</li>
                      <li>연락처: privacy@sajuping.com</li>
                    </ul>
                  </section>

                  <section className="pt-4 border-t">
                    <p className="text-gray-500 text-xs">본 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.</p>
                  </section>
                </div>
              </ScrollArea>
              <div className="p-6 border-t">
                <Button onClick={() => setShowPrivacyDetails(false)} className="w-full">
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}

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
