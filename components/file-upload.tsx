"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadFile, getFileUrl } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"

interface FileUploadProps {
  bucket: string
  path: string
  onUploadComplete?: (url: string) => void
  acceptedFileTypes?: string
  maxSizeMB?: number
}

export function FileUpload({
  bucket,
  path,
  onUploadComplete,
  acceptedFileTypes = "image/*",
  maxSizeMB = 5,
}: FileUploadProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]

      // 파일 크기 검사
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`,
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "파일 선택 필요",
        description: "업로드할 파일을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // 파일 이름에 타임스탬프 추가하여 고유한 파일 이름 생성
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `${path}/${fileName}`

      // 파일 업로드
      await uploadFile(bucket, filePath, file)

      // 업로드된 파일의 URL 가져오기
      const fileUrl = await getFileUrl(bucket, filePath)

      toast({
        title: "업로드 성공",
        description: "파일이 성공적으로 업로드되었습니다.",
      })

      // 콜백 함수 호출
      if (onUploadComplete) {
        onUploadComplete(fileUrl)
      }

      // 파일 상태 초기화
      setFile(null)
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">파일 선택</Label>
        <Input
          id="file-upload"
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {file && (
          <p className="text-sm text-gray-500">
            선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
      </div>

      <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
        {isUploading ? "업로드 중..." : "업로드"}
      </Button>
    </div>
  )
}
