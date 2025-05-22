"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase-client"
import { Loader2, Ban, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { checkAdminStatus } from "@/lib/admin-utils"

interface ApiUsage {
  id: string
  user_id: string
  endpoint: string
  timestamp: string
  ip_address: string
  user_agent: string
  response_status: number
  response_time: number
  cost_units: number
  user_email?: string
}

interface ApiLimit {
  id: string
  endpoint: string
  daily_limit: number
  hourly_limit: number
  cost_per_call: number
}

interface BlockedUser {
  id: string
  user_id: string
  reason: string
  blocked_until: string | null
  is_permanent: boolean
  user_email?: string
}

export default function ApiUsagePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState("usage")
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([])
  const [apiLimits, setApiLimits] = useState<ApiLimit[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [timeRange, setTimeRange] = useState("today")
  const [endpoint, setEndpoint] = useState("all")
  const [editingLimit, setEditingLimit] = useState<ApiLimit | null>(null)
  const [newDailyLimit, setNewDailyLimit] = useState("")
  const [newHourlyLimit, setNewHourlyLimit] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdminUser = await checkAdminStatus()
      setIsAdmin(isAdminUser)

      if (!isAdminUser) {
        toast({
          title: "접근 권한 없음",
          description: "관리자만 접근할 수 있는 페이지입니다.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      await fetchData()
      setIsLoading(false)
    }

    checkAdmin()
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchApiUsage(), fetchApiLimits(), fetchBlockedUsers()])
  }

  const fetchApiUsage = async () => {
    let query = supabase.from("api_usage").select("*")

    // 시간 범위 필터링
    if (timeRange === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      query = query.gte("timestamp", today.toISOString())
    } else if (timeRange === "yesterday") {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      query = query.gte("timestamp", yesterday.toISOString()).lt("timestamp", today.toISOString())
    } else if (timeRange === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte("timestamp", weekAgo.toISOString())
    } else if (timeRange === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      query = query.gte("timestamp", monthAgo.toISOString())
    }

    // 엔드포인트 필터링
    if (endpoint !== "all") {
      query = query.eq("endpoint", endpoint)
    }

    // 검색어 필터링
    if (searchTerm) {
      query = query.or(`ip_address.ilike.%${searchTerm}%,user_id.eq.${searchTerm}`)
    }

    const { data, error } = await query.order("timestamp", { ascending: false }).limit(100)

    if (error) {
      console.error("Error fetching API usage:", error)
      return
    }

    // 사용자 이메일 가져오기
    const userIds = data.filter((item) => item.user_id).map((item) => item.user_id)

    if (userIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, email").in("id", userIds)

      const userMap = new Map()
      users?.forEach((user) => userMap.set(user.id, user.email))

      data.forEach((item) => {
        if (item.user_id && userMap.has(item.user_id)) {
          item.user_email = userMap.get(item.user_id)
        }
      })
    }

    setApiUsage(data || [])
  }

  const fetchApiLimits = async () => {
    const { data, error } = await supabase.from("api_limits").select("*").order("endpoint")

    if (error) {
      console.error("Error fetching API limits:", error)
      return
    }

    setApiLimits(data || [])
  }

  const fetchBlockedUsers = async () => {
    const { data, error } = await supabase.from("blocked_users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching blocked users:", error)
      return
    }

    // 사용자 이메일 가져오기
    const userIds = data.map((item) => item.user_id)

    if (userIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, email").in("id", userIds)

      const userMap = new Map()
      users?.forEach((user) => userMap.set(user.id, user.email))

      data.forEach((item) => {
        if (userMap.has(item.user_id)) {
          item.user_email = userMap.get(item.user_id)
        }
      })
    }

    setBlockedUsers(data || [])
  }

  const handleUpdateLimit = async () => {
    if (!editingLimit) return

    const dailyLimit = Number.parseInt(newDailyLimit)
    const hourlyLimit = Number.parseInt(newHourlyLimit)

    if (isNaN(dailyLimit) || isNaN(hourlyLimit) || dailyLimit <= 0 || hourlyLimit <= 0) {
      toast({
        title: "유효하지 않은 값",
        description: "일일 및 시간당 제한은 양수여야 합니다.",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase
      .from("api_limits")
      .update({
        daily_limit: dailyLimit,
        hourly_limit: hourlyLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingLimit.id)

    if (error) {
      console.error("Error updating API limit:", error)
      toast({
        title: "업데이트 실패",
        description: "API 제한 설정을 업데이트하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "업데이트 성공",
      description: "API 제한 설정이 업데이트되었습니다.",
    })

    setEditingLimit(null)
    fetchApiLimits()
  }

  const handleUnblockUser = async (userId: string) => {
    const { error } = await supabase.from("blocked_users").delete().eq("user_id", userId)

    if (error) {
      console.error("Error unblocking user:", error)
      toast({
        title: "차단 해제 실패",
        description: "사용자 차단을 해제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "차단 해제 성공",
      description: "사용자 차단이 해제되었습니다.",
    })

    fetchBlockedUsers()
  }

  const handleBlockUser = async (userId: string, permanent = false) => {
    const blockedUntil = permanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from("blocked_users").upsert({
      user_id: userId,
      reason: "관리자에 의한 수동 차단",
      blocked_until: blockedUntil,
      is_permanent: permanent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "차단 실패",
        description: "사용자를 차단하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "차단 성공",
      description: `사용자가 ${permanent ? "영구적으로" : "24시간 동안"} 차단되었습니다.`,
    })

    fetchBlockedUsers()
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">API 사용량 관리</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="usage">API 사용량</TabsTrigger>
          <TabsTrigger value="limits">API 제한 설정</TabsTrigger>
          <TabsTrigger value="blocked">차단된 사용자</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API 사용량 조회</CardTitle>
              <CardDescription>API 호출 기록을 조회하고 필터링합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="timeRange">기간</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger id="timeRange">
                      <SelectValue placeholder="기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">오늘</SelectItem>
                      <SelectItem value="yesterday">어제</SelectItem>
                      <SelectItem value="week">최근 7일</SelectItem>
                      <SelectItem value="month">최근 30일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endpoint">엔드포인트</Label>
                  <Select value={endpoint} onValueChange={setEndpoint}>
                    <SelectTrigger id="endpoint">
                      <SelectValue placeholder="엔드포인트 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="/api/saju-interpretation">사주 해석</SelectItem>
                      <SelectItem value="/api/saju-compatibility">궁합 분석</SelectItem>
                      <SelectItem value="/api/saju-additional">추가 질문</SelectItem>
                      <SelectItem value="/api/saju-chat">사주 채팅</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search">검색</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="사용자 ID 또는 IP 주소"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={() => fetchApiUsage()}>검색</Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">시간</th>
                      <th className="p-2 text-left">엔드포인트</th>
                      <th className="p-2 text-left">사용자</th>
                      <th className="p-2 text-left">IP 주소</th>
                      <th className="p-2 text-left">상태</th>
                      <th className="p-2 text-left">응답 시간</th>
                      <th className="p-2 text-left">비용</th>
                      <th className="p-2 text-left">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiUsage.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-muted-foreground">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      apiUsage.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{new Date(item.timestamp).toLocaleString()}</td>
                          <td className="p-2">{item.endpoint}</td>
                          <td className="p-2">{item.user_email || item.user_id || "비회원"}</td>
                          <td className="p-2">{item.ip_address}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                item.response_status >= 200 && item.response_status < 300
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.response_status}
                            </span>
                          </td>
                          <td className="p-2">{item.response_time}ms</td>
                          <td className="p-2">{item.cost_units}</td>
                          <td className="p-2">
                            {item.user_id && (
                              <Button variant="outline" size="sm" onClick={() => handleBlockUser(item.user_id)}>
                                차단
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">총 {apiUsage.length}개의 결과</span>
                </div>
                <Button onClick={() => fetchApiUsage()}>새로고침</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API 사용량 통계</CardTitle>
              <CardDescription>엔드포인트별 API 사용량 통계를 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { endpoint: "/api/saju-interpretation", title: "사주 해석" },
                  { endpoint: "/api/saju-compatibility", title: "궁합 분석" },
                  { endpoint: "/api/saju-additional", title: "추가 질문" },
                  { endpoint: "/api/saju-chat", title: "사주 채팅" },
                ].map((api) => {
                  const count = apiUsage.filter((item) => item.endpoint === api.endpoint).length
                  const cost = apiUsage
                    .filter((item) => item.endpoint === api.endpoint)
                    .reduce((sum, item) => sum + item.cost_units, 0)

                  return (
                    <Card key={api.endpoint}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{api.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{count}</div>
                        <p className="text-xs text-muted-foreground">총 비용: {cost} 단위</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API 제한 설정</CardTitle>
              <CardDescription>API 엔드포인트별 호출 제한을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">엔드포인트</th>
                      <th className="p-2 text-left">일일 제한</th>
                      <th className="p-2 text-left">시간당 제한</th>
                      <th className="p-2 text-left">호출당 비용</th>
                      <th className="p-2 text-left">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLimits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      apiLimits.map((limit) => (
                        <tr key={limit.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{limit.endpoint}</td>
                          <td className="p-2">
                            {editingLimit?.id === limit.id ? (
                              <Input
                                type="number"
                                value={newDailyLimit}
                                onChange={(e) => setNewDailyLimit(e.target.value)}
                                className="w-20"
                              />
                            ) : (
                              limit.daily_limit
                            )}
                          </td>
                          <td className="p-2">
                            {editingLimit?.id === limit.id ? (
                              <Input
                                type="number"
                                value={newHourlyLimit}
                                onChange={(e) => setNewHourlyLimit(e.target.value)}
                                className="w-20"
                              />
                            ) : (
                              limit.hourly_limit
                            )}
                          </td>
                          <td className="p-2">{limit.cost_per_call}</td>
                          <td className="p-2">
                            {editingLimit?.id === limit.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleUpdateLimit}>
                                  저장
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setEditingLimit(null)}>
                                  취소
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingLimit(limit)
                                  setNewDailyLimit(limit.daily_limit.toString())
                                  setNewHourlyLimit(limit.hourly_limit.toString())
                                }}
                              >
                                수정
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>차단된 사용자</CardTitle>
              <CardDescription>API 사용이 차단된 사용자 목록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">사용자</th>
                      <th className="p-2 text-left">차단 이유</th>
                      <th className="p-2 text-left">차단 시간</th>
                      <th className="p-2 text-left">차단 해제 시간</th>
                      <th className="p-2 text-left">상태</th>
                      <th className="p-2 text-left">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          차단된 사용자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      blockedUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{user.user_email || user.user_id}</td>
                          <td className="p-2">{user.reason}</td>
                          <td className="p-2">{new Date(user.created_at).toLocaleString()}</td>
                          <td className="p-2">
                            {user.is_permanent
                              ? "영구 차단"
                              : user.blocked_until
                                ? new Date(user.blocked_until).toLocaleString()
                                : "정보 없음"}
                          </td>
                          <td className="p-2">
                            {user.is_permanent ? (
                              <span className="flex items-center text-red-600">
                                <Ban className="h-4 w-4 mr-1" />
                                영구 차단
                              </span>
                            ) : user.blocked_until && new Date(user.blocked_until) > new Date() ? (
                              <span className="flex items-center text-yellow-600">
                                <Clock className="h-4 w-4 mr-1" />
                                임시 차단
                              </span>
                            ) : (
                              <span className="flex items-center text-green-600">차단 해제됨</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleUnblockUser(user.user_id)}>
                                차단 해제
                              </Button>
                              {!user.is_permanent && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleBlockUser(user.user_id, true)}
                                >
                                  영구 차단
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
