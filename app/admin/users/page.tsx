"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  gender: string
  phone: string | null
  is_beta_applicant: boolean
  created_at: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const { callApi, isLoading } = useApi<any, { users: User[] }>()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    phone: "",
  })

  const fetchUsers = async () => {
    const result = await callApi({ url: "/api/users" })
    if (result) {
      setUsers(result.users)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      gender: user.gender,
      phone: user.phone || "",
    })
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      const result = await callApi({
        url: "/api/users",
        method: "DELETE",
        params: { id: userId },
      })

      if (result) {
        toast({
          title: "사용자 삭제 성공",
          description: "사용자가 성공적으로 삭제되었습니다.",
        })
        fetchUsers()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const userData = {
      ...formData,
      id: selectedUser?.id,
    }

    const result = await callApi({
      url: "/api/users",
      method: "POST",
      body: userData,
    })

    if (result) {
      toast({
        title: selectedUser ? "사용자 업데이트 성공" : "사용자 생성 성공",
        description: selectedUser
          ? "사용자 정보가 성공적으로 업데이트되었습니다."
          : "새 사용자가 성공적으로 생성되었습니다.",
      })

      setSelectedUser(null)
      setFormData({
        name: "",
        email: "",
        gender: "",
        phone: "",
      })

      fetchUsers()
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">사용자 관리</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{selectedUser ? "사용자 수정" : "새 사용자 추가"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">성별</Label>
              <Input id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {selectedUser && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedUser(null)
                  setFormData({
                    name: "",
                    email: "",
                    gender: "",
                    phone: "",
                  })
                }}
              >
                취소
              </Button>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : selectedUser ? "업데이트" : "추가"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">사용자 목록</h2>

        {isLoading ? (
          <div className="text-center py-4">사용자 목록을 불러오는 중...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4">등록된 사용자가 없습니다.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>베타 신청</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.gender}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.is_beta_applicant ? "예" : "아니오"}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} title="사용자 수정">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} title="사용자 삭제">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
