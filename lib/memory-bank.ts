"use client"

/**
 * MEMORY BANK - UI/UX 규칙 및 중요 사항
 *
 * 이 파일은 프로젝트의 중요한 UI/UX 규칙들을 기록하여
 * 향후 수정 시 실수를 방지하기 위한 메모리 뱅크입니다.
 *
 * ⚠️ 주의: 이 규칙들은 절대 reverse 되어서는 안됩니다.
 */

export const MEMORY_BANK_RULES = {
  /**
   * 🚨 CRITICAL RULE: 채팅 페이지 네비게이션 바 숨김
   *
   * 규칙: 채팅 페이지(/saju-chat, /chat-list 등)에서는
   * 하단 네비게이션 바(BottomNavBar)를 반드시 숨겨야 합니다.
   *
   * 이유:
   * - 채팅 입력창과 하단 네비게이션 바가 겹쳐서 사용성이 떨어짐
   * - 모바일에서 키보드가 올라올 때 레이아웃 충돌 발생
   * - 채팅 UX에서는 전체 화면 활용이 중요함
   *
   * 적용 페이지:
   * - /saju-chat/[roomType]
   * - /chat-list
   * - /chat/[id] (향후 추가될 수 있는 개별 채팅 페이지)
   *
   * 구현 방법:
   * - usePathname()을 사용하여 현재 경로 확인
   * - 채팅 관련 경로에서는 BottomNavBar 컴포넌트를 렌더링하지 않음
   *
   * ⚠️ 절대 변경하지 말 것: 이 규칙은 사용자 경험에 직접적인 영향을 미칩니다.
   */
  HIDE_BOTTOM_NAV_ON_CHAT: {
    rule: "채팅 페이지에서는 하단 네비게이션 바를 숨긴다",
    paths: ["/saju-chat", "/chat-list", "/chat"],
    reason: "채팅 입력창과 네비게이션 바 충돌 방지",
    priority: "CRITICAL",
    lastUpdated: "2025-01-03",
  },

  /**
   * 기타 UI/UX 규칙들 (향후 추가)
   */
  // 여기에 다른 중요한 UI/UX 규칙들을 추가할 수 있습니다.
} as const

/**
 * 채팅 페이지인지 확인하는 유틸리티 함수
 */
export function isChatPage(pathname: string): boolean {
  const chatPaths = ["/saju-chat", "/chat-list", "/chat"]
  return chatPaths.some((path) => pathname.startsWith(path))
}

/**
 * 하단 네비게이션 바를 숨겨야 하는 페이지인지 확인
 */
export function shouldHideBottomNav(pathname: string): boolean {
  return isChatPage(pathname)
}
