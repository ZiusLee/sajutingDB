"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

interface SmartMemory {
  id: string
  user_id: string
  content: string
  type: string
  keywords: string
  importance: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

interface MemoryEditDialogProps {
  memory: SmartMemory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<SmartMemory>) => Promise<void>
}

export function MemoryEditDialog({ memory, open, onOpenChange, onSave }: MemoryEditDialogProps) {
  const [content, setContent] = useState("")
  const [type, setType] = useState("")
  const [keywords, setKeywords] = useState("")
  const [importance, setImportance] = useState([5])
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  // 메모리가 변경될 때 폼 초기화
  useState(() => {
    if (memory) {
      setContent(memory.content)
      setType(memory.type)
      setKeywords(memory.keywords)
      setImportance([memory.importance])
      setIsPinned(memory.is_pinned)
    }
  }, [memory])

  const handleSave = async () => {
    if (!memory) return

    setSaving(true)
    try {
      await onSave(memory.id, {
        content,
        type,
        keywords,
        importance: importance[0],
        is_pinned: isPinned,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("저장 실패:", error)
    } finally {
      setSaving(false)
    }
  }

  if (!memory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>메모리 편집</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메모리 내용을 입력하세요"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="type">타입</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="메모리 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">개인정보</SelectItem>
                <SelectItem value="preference">선호도</SelectItem>
                <SelectItem value="context">대화맥락</SelectItem>
                <SelectItem value="goal">목표</SelectItem>
                <SelectItem value="relationship">관계</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="keywords">키워드</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="쉼표로 구분된 키워드"
            />
          </div>

          <div>
            <Label>중요도: {importance[0]}</Label>
            <Slider value={importance} onValueChange={setImportance} max={10} min={1} step={1} className="mt-2" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} />
            <Label htmlFor="pinned">중요 메모리로 고정</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
