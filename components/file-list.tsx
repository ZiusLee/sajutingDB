"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { listFiles, deleteFile, getFileUrl } from "@/lib/supabase-storage"
import { useToast } from "@/components/ui/use-toast"
import type { FileObject } from "@supabase/storage-js"
import { Trash2 } from "lucide-react"

interface FileListProps {
  bucket: string
  path?: string
  onFileSelect?: (url: string) => void
  onFileDelete?: () => void
}

export function FileList({ bucket, path = "", onFileSelect, onFileDelete }: FileListProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileObject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const fileList = await listFiles(bucket, path)
      setFiles(fileList)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "파일 목록 로드 실패",
        description: "파일 목록을 가져오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [bucket, path])

  const handleFileClick = async (file: FileObject) => {
    try {
      const filePath = path ? `${path}/${file.name}` : file.name
      const url = await getFileUrl(bucket, filePath)

      if (onFileSelect) {
        onFileSelect(url)
      }
    } catch (error) {
      console.error("Error getting file URL:", error)
      toast({
        title: "파일 URL 가져오기 실패",
        description: "파일 URL을 가져오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleFileDelete = async (file: FileObject) => {
    try {
      const filePath = path ? `${path}/${file.name}` : file.name
      await deleteFile(bucket, filePath)

      toast({
        title: "파일 삭제 성공",
        description: "파일이 성공적으로 삭제되었습니다.",
      })

      // 파일 목록 새로고침
      fetchFiles()

      if (onFileDelete) {
        onFileDelete()
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "파일 삭제 실패",
        description: "파일 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">파일 목록을 불러오는 중...</div>
  }

  if (files.length === 0) {
    return <div className="text-center py-4">파일이 없습니다.</div>
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">파일 목록</h3>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id} className="flex items-center justify-between p-2 border rounded-md">
            <button className="text-left flex-1 truncate hover:text-primary" onClick={() => handleFileClick(file)}>
              {file.name}
            </button>
            <Button variant="ghost" size="icon" onClick={() => handleFileDelete(file)} title="파일 삭제">
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
