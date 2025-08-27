"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"

interface MultipleDefaultSessionsDialogProps {
  open: boolean
  sessions: any[]
  onSelectSession: (sessionId: string) => void
  onCancel: () => void
}

export function MultipleDefaultSessionsDialog({
  open,
  sessions,
  onSelectSession,
  onCancel,
}: MultipleDefaultSessionsDialogProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")

  const handleConfirm = () => {
    if (selectedSessionId) {
      onSelectSession(selectedSessionId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>대표 사주 선택</DialogTitle>
          <DialogDescription>여러 개의 대표 사주가 설정되어 있습니다. 하나를 선택해주세요.</DialogDescription>
        </DialogHeader>

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
                  생성일: {formatDate(session.created_at)}
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
            선택 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
