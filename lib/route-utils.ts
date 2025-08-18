// 관리자 페이지 경로 목록
export const ADMIN_ROUTES = ["/admin", "/admin/manage-coins", "/admin/users", "/admin/update-saju"]

// 현재 경로가 관리자 페이지인지 확인
export function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some((route) => path.startsWith(route))
}
