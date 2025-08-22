"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, User, AlertTriangle } from "lucide-react"

interface SelectDefaultSajuDialogProps {
  open: boolean
  sessions: any[]
  onSelectSession: (sessionId: string) => void
  onCancel: () => void
}

export function SelectDefaultSajuDialog({ open, sessions, onSelectSession, onCancel }: SelectDefaultSajuDialogProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")

  const handleConfirm = () => {
    if (selectedSessionId) {
      onSelectSession(selectedSessionId)
    }
  }

  const formatBirthDate = (session: any) => {
    if (session.birthYear && session.birthMonth && session.birthDay) {
      return `${session.birthYear}년 ${session.birthMonth}월 ${session.birthDay}일`
    }
    return "생년월일 정보 없음"
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>대표 사주 선택</DialogTitle>
          <DialogDescription>
            대표 사주가 설정되지 않았습니다. 기존 사주 중에서 대표 사주로 사용할 것을 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>중요:</strong> 대표 사주로 설정하면 앞으로 다시 변경할 수 없습니다. 신중하게 선택해주세요.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all ${
                selectedSessionId === session.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedSessionId(session.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {session.name || "무명"}
                  </CardTitle>
                  <Badge variant="secondary">{session.gender === "male" ? "남성" : "여성"}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  생년월일: {formatBirthDate(session)}
                </CardDescription>
              </CardHeader>

              {session.saju && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium">년주</div>
                      <div>
                        {session.saju.yearStem || "?"}
                        {session.saju.yearBranch || "?"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">월주</div>
                      <div>
                        {session.saju.monthStem || "?"}
                        {session.saju.monthBranch || "?"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">일주</div>
                      <div>
                        {session.saju.dayStem || "?"}
                        {session.saju.dayBranch || "?"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">시주</div>
                      <div>
                        {session.saju.hourStem || "?"}
                        {session.saju.hourBranch || "?"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedSessionId}>
            대표 사주로 설정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
