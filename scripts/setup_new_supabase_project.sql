-- 새로운 Supabase 프로젝트 설정을 위한 SQL 스크립트

-- 1. saju_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS public.saju_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    gender TEXT,
    relationship_status TEXT,
    is_beta_applicant BOOLEAN DEFAULT false,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. birth_info 테이블 생성
CREATE TABLE IF NOT EXISTS public.birth_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.saju_sessions(id) ON DELETE CASCADE,
    solar_year INTEGER NOT NULL,
    solar_month INTEGER NOT NULL,
    solar_day INTEGER NOT NULL,
    solar_hour INTEGER,
    solar_minute INTEGER,
    lunar_year INTEGER NOT NULL,
    lunar_month INTEGER NOT NULL,
    lunar_day INTEGER NOT NULL,
    is_leap_month BOOLEAN DEFAULT false,
    time_unknown BOOLEAN DEFAULT false,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. saju_info 테이블 생성
CREATE TABLE IF NOT EXISTS public.saju_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.saju_sessions(id) ON DELETE CASCADE,
    year_stem TEXT NOT NULL,
    year_branch TEXT NOT NULL,
    year_stem_hanja TEXT NOT NULL,
    year_branch_hanja TEXT NOT NULL,
    month_stem TEXT NOT NULL,
    month_branch TEXT NOT NULL,
    month_stem_hanja TEXT NOT NULL,
    month_branch_hanja TEXT NOT NULL,
    day_stem TEXT NOT NULL,
    day_branch TEXT NOT NULL,
    day_stem_hanja TEXT NOT NULL,
    day_branch_hanja TEXT NOT NULL,
    hour_stem TEXT NOT NULL,
    hour_branch TEXT NOT NULL,
    hour_stem_hanja TEXT NOT NULL,
    hour_branch_hanja TEXT NOT NULL,
    day_master TEXT NOT NULL,
    day_master_hanja TEXT NOT NULL,
    year_animal TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. elements 테이블 생성
CREATE TABLE IF NOT EXISTS public.elements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    saju_id UUID REFERENCES public.saju_info(id) ON DELETE CASCADE,
    wood INTEGER DEFAULT 0,
    fire INTEGER DEFAULT 0,
    earth INTEGER DEFAULT 0,
    metal INTEGER DEFAULT 0,
    water INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE public.saju_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birth_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;

-- 6. 기본 정책 생성 (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY "Users can view own saju_sessions" ON public.saju_sessions
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own saju_sessions" ON public.saju_sessions
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own saju_sessions" ON public.saju_sessions
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_saju_sessions_auth_user_id ON public.saju_sessions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_saju_sessions_email ON public.saju_sessions(email);
CREATE INDEX IF NOT EXISTS idx_birth_info_user_id ON public.birth_info(user_id);
CREATE INDEX IF NOT EXISTS idx_saju_info_user_id ON public.saju_info(user_id);
