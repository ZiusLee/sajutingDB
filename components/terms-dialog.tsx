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
import Link from "next/link"

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
                  <Link className="underline underline-offset-4" href="/privacy" prefetch={false}>
                    자세히
                  </Link>
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
