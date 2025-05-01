# 사주팅 (Saju-ting)

사주팅은 한국 전통 사주 분석을 제공하는 웹 애플리케이션입니다. 사용자의 생년월일시를 기반으로 사주 정보를 계산하고, AI를 활용하여 해석을 제공합니다.

## 프로젝트 구조

이 프로젝트는 Next.js App Router를 사용하여 구축되었으며, Supabase를 데이터베이스 및 인증 서비스로 활용합니다.

### 주요 기능

- 사용자 인증 (Supabase Auth)
- 사주 계산 및 분석
- 사주 호환성 분석
- 채팅 기반 사주 상담
- 사용자 프로필 관리

## 데이터베이스 스키마

최근 데이터베이스 스키마가 업데이트되었습니다. 주요 변경사항은 `users` 테이블을 `saju_sessions`로 변경한 것입니다.

### 주요 테이블

#### saju_sessions
사용자 세션 및 프로필 정보를 저장합니다.

\`\`\`sql
CREATE TABLE saju_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255),
  gender VARCHAR(50),
  relationship_status VARCHAR(50),
  is_beta_applicant BOOLEAN DEFAULT FALSE,
  auth_user_id UUID, -- Supabase Auth 사용자 ID와 연결
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

#### birth_info
사주 계산을 위한 생년월일 정보를 저장합니다.

\`\`\`sql
CREATE TABLE birth_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES saju_sessions(id) ON DELETE CASCADE,
  solar_year INTEGER,
  solar_month INTEGER,
  solar_day INTEGER,
  solar_hour INTEGER,
  solar_minute INTEGER,
  lunar_year INTEGER,
  lunar_month INTEGER,
  lunar_day INTEGER,
  is_leap_month BOOLEAN DEFAULT FALSE,
  time_unknown BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

#### saju_info
계산된 사주 정보를 저장합니다.

\`\`\`sql
CREATE TABLE saju_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES saju_sessions(id) ON DELETE CASCADE,
  year_stem VARCHAR(10),
  year_branch VARCHAR(10),
  year_stem_hanja VARCHAR(10),
  year_branch_hanja VARCHAR(10),
  month_stem VARCHAR(10),
  month_branch VARCHAR(10),
  month_stem_hanja VARCHAR(10),
  month_branch_hanja VARCHAR(10),
  day_stem VARCHAR(10),
  day_branch VARCHAR(10),
  day_stem_hanja VARCHAR(10),
  day_branch_hanja VARCHAR(10),
  hour_stem VARCHAR(10),
  hour_branch VARCHAR(10),
  hour_stem_hanja VARCHAR(10),
  hour_branch_hanja VARCHAR(10),
  day_master VARCHAR(10),
  day_master_hanja VARCHAR(10),
  year_animal VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

#### elements
사주의 오행 정보를 저장합니다.

\`\`\`sql
CREATE TABLE elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saju_id UUID REFERENCES saju_info(id) ON DELETE CASCADE,
  wood INTEGER DEFAULT 0,
  fire INTEGER DEFAULT 0,
  earth INTEGER DEFAULT 0,
  metal INTEGER DEFAULT 0,
  water INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

#### interpretations
사주 해석 정보를 저장합니다.

\`\`\`sql
CREATE TABLE interpretations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES saju_sessions(id) ON DELETE CASCADE,
  basic_interpretation TEXT,
  model_used VARCHAR(100),
  response_time VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

#### chat_rooms
채팅방 정보를 저장합니다.

\`\`\`sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES saju_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES saju_sessions(id),
  room_type VARCHAR(50),
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

#### messages
채팅 메시지를 저장합니다.

\`\`\`sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_type VARCHAR(50),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## 인증 및 사용자 데이터 연결 흐름

### 현재 구현된 인증 흐름

1. 사용자는 처음에 인증 없이 사주 정보를 입력할 수 있습니다 (`saju_sessions` 테이블에 저장).
2. 사용자가 나중에 회원가입하거나 로그인하면, 기존 세션 데이터를 인증된 사용자 계정에 연결합니다.
3. 연결은 `saju_sessions` 테이블의 `auth_user_id` 필드를 Supabase Auth의 사용자 ID로 업데이트하여 이루어집니다.

### 데이터 연결 방법

현재 다음과 같은 방법으로 데이터 연결을 시도합니다:

1. **자동 연결**: 로그인 시 localStorage에 저장된 세션 ID, 이메일 또는 이름 매칭을 통해 자동으로 연결
2. **수동 연결**: 사용자가 마이페이지에서 세션 ID를 직접 입력하여 연결
3. **디버그 연결**: 개발자 도구를 통해 최근 세션을 강제로 연결

## 현재 문제점: 마이페이지 데이��� 표시 이슈

현재 마이페이지에서 사용자의 사주 프로필 정보를 표시하는 데 문제가 있습니다. `auth_user_id`가 성공적으로 업데이트되었음에도 불구하고 데이터를 가져오지 못하고 있습니다.

### 문제 진단

1. **쿼리 구조 문제**: `getUserSajuProfiles` 함수에서 사용하는 조인 쿼리가 올바르게 작동하지 않을 수 있습니다.

\`\`\`typescript
// lib/saju-session-service.ts
const { data: sessions, error: sessionsError } = await supabase
  .from("saju_sessions")
  .select(`
    id,
    name,
    gender,
    email,
    created_at,
    is_default,
    auth_user_id,
    birth_info (
      id,
      solar_year,
      solar_month,
      solar_day,
      solar_hour,
      solar_minute,
      lunar_year,
      lunar_month,
      lunar_day,
      time_unknown
    ),
    saju_info (
      year_stem,
      year_branch,
      month_stem,
      month_branch,
      day_stem,
      day_branch,
      hour_stem,
      hour_branch
    )
  `)
  .eq("auth_user_id", authUserId)
\`\`\`

2. **데이터 관계 문제**: `birth_info`와 `saju_info` 테이블의 관계가 올바르게 설정되지 않았을 수 있습니다.

3. **타이밍 이슈**: 인증 상태와 데이터 로딩 사이의 타이밍 문제가 있을 수 있습니다.

### 디버깅 방법

마이페이지에는 디버그 기능이 구현되어 있어 다음 정보를 확인할 수 있습니다:

1. 현재 인증된 사용자 ID
2. 데이터베이스의 총 세션 수
3. 현재 사용자와 연결된 세션 수
4. localStorage에 저장된 사용자 ID
5. 가장 최근 생성된 세션 정보

## 개발자를 위한 팁

### 데이터 연결 디버깅

1. 마이페이지에서 디버그 버튼(🐛)을 클릭하여 디버그 정보를 확인합니다.
2. 콘솔 로그를 확인하여 쿼리 실행 결과와 오류를 확인합니다.
3. "최근 세션 연결 수정" 버튼을 사용하여 가장 최근 세션을 현재 인증된 사용자에게 강제로 연결할 수 있습니다.

### 쿼리 문제 해결

1. Supabase 대시보드에서 직접 SQL 쿼리를 실행하여 데이터 구조를 확인합니다.
2. 다음 쿼리로 특정 사용자의 세션을 확인할 수 있습니다:

\`\`\`sql
SELECT * FROM saju_sessions WHERE auth_user_id = '인증된_사용자_ID';
\`\`\`

3. 관계 확인을 위한 쿼리:

\`\`\`sql
SELECT s.id, s.name, b.id as birth_id, si.id as saju_id
FROM saju_sessions s
LEFT JOIN birth_info b ON s.id = b.user_id
LEFT JOIN saju_info si ON s.id = si.user_id
WHERE s.auth_user_id = '인증된_사용자_ID';
\`\`\`

## 주요 파일 및 컴포넌트

### 핵심 서비스 파일

- `lib/saju-session-service.ts`: 사주 세션 관리 서비스
- `lib/saju.ts`: 사주 계산 로직
- `lib/lunar-calendar.ts`: 음력 변환 로직
- `lib/supabase-client.ts`: Supabase 클라이언트 설정
- `lib/auth-utils.ts`: 인증 관련 유틸리티 함수
- `lib/user-data-transfer.ts`: 사용자 데이터 연결 로직

### 주요 컴포넌트

- `components/birth-date-form.tsx`: 생년월일 입력 폼
- `components/saju-result.tsx`: 사주 결과 표시
- `components/saju-diagram.tsx`: 사주 다이어그램 시각화
- `components/saju-chat.tsx`: 사주 채팅 인터페이스
- `components/compatibility-comparison.tsx`: 사주 호환성 비교

### API 라우트

- `app/api/birth-info/route.ts`: 생년월일 정보 저장
- `app/api/saju-interpretation/route.ts`: 사주 해석 API
- `app/api/lunar-date/route.ts`: 음력 변환 API
- `app/api/save-saju-data/route.ts`: 사주 데이터 저장
- `app/api/link-user-data/route.ts`: 사용자 데이터 연결 API

## 마이그레이션 및 데이터 관리

최근 `users` 테이블에서 `saju_sessions` 테이블로의 마이그레이션이 진행되었���니다. 이 과정에서 다음과 같은 작업이 수행되었습니다:

1. 새 테이블 구조 생성
2. 기존 데이터 마이그레이션
3. 외래 키 제약 조건 업데이트
4. 코드 리팩토링

마이그레이션 유틸리티는 `lib/migration-utils.ts`에 구현되어 있으며, 다음과 같은 기능을 제공합니다:

- 테이블 존재 여부 확인
- 컬럼 존재 여부 확인
- 안전한 마이그레이션 실행
- 사용자 데이터 마이그레이션

## 다음 단계

1. 마이페이지 데이터 로딩 이슈 해결
2. 사용자 프로필 관리 기능 개선
3. 데이터 마이그레이션 완료 (users → saju_sessions)
4. 사주 해석 및 채팅 기능 개선

## 기술 스택

- **프론트엔드**: Next.js, React, Tailwind CSS, shadcn/ui
- **백엔드**: Next.js API Routes, Supabase Functions
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **AI 모델**: OpenAI GPT-4, Deepseek, Grok

## 로컬 개발 환경 설정

1. 저장소 클론
\`\`\`bash
git clone https://github.com/your-username/sajuping.git
cd sajuping
\`\`\`

2. 의존성 설치
\`\`\`bash
npm install
# 또는
yarn install
\`\`\`

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수를 설정합니다:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
\`\`\`

4. 개발 서버 실행
\`\`\`bash
npm run dev
# 또는
yarn dev
\`\`\`

5. 브라우저에서 `http://localhost:3000`으로 접속
