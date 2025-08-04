import { createClient } from "@supabase/supabase-js"

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 파일 업로드 함수
export async function uploadFile(bucket: string, path: string, file: File) {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// 파일 다운로드 URL 가져오기
export async function getFileUrl(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).getPublicUrl(path)

    if (error) {
      throw error
    }

    return data.publicUrl
  } catch (error) {
    console.error("Error getting file URL:", error)
    throw error
  }
}

// 파일 삭제 함수
export async function deleteFile(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// 파일 목록 가져오기
export async function listFiles(bucket: string, path?: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path || "")

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error listing files:", error)
    throw error
  }
}
