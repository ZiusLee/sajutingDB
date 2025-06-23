-- 최근 개발 로그를 메모리뱅크에 저장
-- 2025년 1월 23일 작업 내용

INSERT INTO memory_bank (
  session_id,
  user_id, 
  memory_type,
  title,
  content,
  tags,
  importance_score,
  created_at
) VALUES 
-- 결제 기능 임시 비활성화
(
  'dev_log_2025_01_23',
  'system',
  'development_log',
  '결제 기능 임시 비활성화 완료',
  '## 🔧 결제 기능 임시 비활성화

### 변경된 파일들:
- `components/coin-purchase-modal.tsx`: 구매 버튼 클릭 시 "결제 기능 준비 중입니다" 알림 표시
- `app/coin-shop/page.tsx`: 페이지 진입 시 바로 점검 모달 표시, 전체 페이지 음영 처리
- `components/coin-manager.tsx`: 충전 버튼 클릭 시 준비 중 메시지

### 복원 방법:
1. `===== 결제 기능 임시 비활성화 =====` 부분 삭제
2. `/* ===== 실제 결제 로직 (임시 주석처리) =====` 부분 주석 해제

### 사용자 경험:
- 코인충전 페이지 접속 시 바로 "준비 중입니다" 모달 표시
- 배경 흐림 효과로 점검 중임을 명확히 표시
- 돌아가기 버튼으로 이전 페이지 이동 가능',
  ARRAY['payment', 'maintenance', 'ui', 'toss-payments'],
  9,
  NOW()
),

-- 로그인 화면 엔터 키 동작 수정
(
  'dev_log_2025_01_23',
  'system',
  'development_log', 
  '로그인 화면 엔터 키 동작 수정',
  '## 🔧 로그인 폼 엔터 키 동작 수정

### 문제:
- 비밀번호 입력 후 엔터 키를 누르면 비밀번호 찾기 버튼이 클릭됨
- 로그인 버튼이 아닌 잘못된 버튼이 기본 동작으로 설정됨

### 해결책:
- `app/login/page.tsx` 수정
- 비밀번호 찾기 버튼: `type="button"` 명시적 추가
- 로그인 버튼: `type="submit"` 명시적 지정
- 다른 방법으로 로그인 버튼들: `type="button"` 추가

### 결과:
- 비밀번호 입력 후 엔터 키로 정상 로그인 가능
- 폼 제출 시 `handleEmailLogin` 함수 정상 호출',
  ARRAY['login', 'form', 'ux', 'keyboard-shortcut'],
  8,
  NOW()
),

-- 사주 정보 유효성 검증 강화
(
  'dev_log_2025_01_23',
  'system',
  'development_log',
  '사주 정보 유효성 검증 강화',
  '## 🔧 사주 프로필 유효성 검증 강화

### 문제:
- 빈 데이터나 N/A 값이 있는 사주 프로필도 표시됨
- "여성 • N/A.N/A.N/A N/A:N/A" 같은 무효한 데이터 표시

### 해결책:
- `lib/saju-session-service.ts`에 `isValidSajuProfile()` 함수 추가
- 필수 필드 검증:
  - 이름이 "무명", "N/A", 빈 값이 아닌지 확인
  - 생년월일이 "N/A"나 빈 값이 아닌지 확인  
  - 사주 정보(간지)가 모두 유효한지 확인

### 적용:
- `getUserSajuProfiles()`: 유효한 프로필만 반환
- `getSajuProfileBySessionId()`: 유효성 검사 추가

### 결과:
- 유효한 사주만 마이페이지에 표시
- 빈 데이터 제외로 깔끔한 UI
- 유효하지 않은 데이터는 0명으로 정확히 표시',
  ARRAY['saju', 'validation', 'data-filtering', 'mypage'],
  8,
  NOW()
),

-- HTML 중첩 오류 수정
(
  'dev_log_2025_01_23',
  'system',
  'development_log',
  'HTML 중첩 오류 수정 (Hydration Error)',
  '## 🔧 HTML 중첩 오류 수정

### 문제:
- `<p> cannot be a descendant of <p>` Hydration 오류 발생
- `DialogDescription` 컴포넌트가 이미 `<p>` 태그로 렌더링되는데 내부에 또 `<p>` 태그 사용

### 해결책:
- `app/coin-shop/page.tsx` 수정
- `DialogDescription` 내부의 `<p>` 태그를 `<div>` 태그로 변경
- 스타일링은 `text-center space-y-2` 클래스로 동일하게 유지

### 결과:
- Hydration 오류 해결
- 유효한 HTML 구조로 변경
- 시각적 효과는 동일하게 유지',
  ARRAY['html', 'hydration', 'react', 'dialog'],
  7,
  NOW()
),

-- 코인 제한 임시 해제
(
  'dev_log_2025_01_23',
  'system',
  'development_log',
  '코인 제한 임시 해제 (결제 도입 전)',
  '## 🔧 코인 제한 임시 해제

### 목적:
- 결제 기능 도입 전까지 사용자가 코인 걱정 없이 서비스 이용 가능
- 음수 코인은 프론트엔드에서 0으로 표시

### 변경사항:
1. **코인 사용 제한 해제**:
   - `app/api/user-coins/route.ts`: 코인 부족 체크 로직 주석처리
   - 코인이 0 이하여도 계속 사용 가능

2. **프론트엔드 표시 개선**:
   - `Math.max(0, coins)` 사용하여 음수 코인을 0으로 표시
   - `components/coin-manager.tsx`, `components/saju-chat.tsx`, `app/mypage/page.tsx` 적용

### 복원 방법:
1. `===== 결제 도입 전 임시 조치 =====` 부분 삭제
2. `/* ===== 원래 코인 부족 체크 로직 =====` 부분 주석 해제
3. 프론트엔드 표시는 그대로 유지 (음수 방지)

### 현재 동작:
- 코인 0 이하에서도 AI 채팅 무제한 이용
- 음수 코인은 0으로 깔끔하게 표시
- 코인 추가/차감 로직은 정상 동작',
  ARRAY['coin', 'payment', 'temporary-fix', 'unlimited-usage'],
  9,
  NOW()
),

-- Supabase 클라이언트 최적화
(
  'dev_log_2025_01_23',
  'system',
  'development_log',
  'Supabase 클라이언트 중복 생성 경고 해결',
  '## 🔧 Supabase 클라이언트 최적화

### 문제:
- "Multiple GoTrueClient instances detected" 경고 발생
- 여러 곳에서 Supabase 클라이언트를 중복 생성

### 해결 시도:
- `lib/supabase-client.ts`에서 강력한 싱글톤 패턴 구현
- `getSupabase()` 함수로 단일 인스턴스 보장
- 모든 컴포넌트에서 `getSupabase()` 사용하도록 통일

### 현재 상태:
- 싱글톤 패턴 적용 완료
- `supabase` export 유지하여 기존 import 호환성 보장
- 추가 최적화 필요할 수 있음

### 모니터링 필요:
- 브라우저 콘솔에서 "Creating new Supabase client instance" 메시지 확인
- 경고 메시지 지속 여부 관찰',
  ARRAY['supabase', 'singleton', 'optimization', 'client'],
  6,
  NOW()
);
