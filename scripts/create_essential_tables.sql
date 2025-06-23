-- Create saju_sessions table (main user table)
CREATE TABLE IF NOT EXISTS public.saju_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    gender TEXT NOT NULL DEFAULT 'unknown',
    relationship_status TEXT NOT NULL DEFAULT 'unknown',
    is_beta_applicant BOOLEAN DEFAULT false,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create birth_info table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create saju_info table
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

-- Create elements table
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

-- Create interpretations table
CREATE TABLE IF NOT EXISTS public.interpretations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.saju_sessions(id) ON DELETE CASCADE,
    basic_interpretation TEXT NOT NULL,
    model_used TEXT DEFAULT 'gpt-4',
    response_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.saju_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birth_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpretations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON public.saju_sessions
    FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own birth info" ON public.birth_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.saju_sessions 
            WHERE id = birth_info.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own saju info" ON public.saju_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.saju_sessions 
            WHERE id = saju_info.user_id 
            AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own elements" ON public.elements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.saju_info si
            JOIN public.saju_sessions ss ON si.user_id = ss.id
            WHERE si.id = elements.saju_id 
            AND ss.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own interpretations" ON public.interpretations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.saju_sessions 
            WHERE id = interpretations.user_id 
            AND auth_user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saju_sessions_auth_user_id ON public.saju_sessions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_birth_info_user_id ON public.birth_info(user_id);
CREATE INDEX IF NOT EXISTS idx_saju_info_user_id ON public.saju_info(user_id);
CREATE INDEX IF NOT EXISTS idx_elements_saju_id ON public.elements(saju_id);
CREATE INDEX IF NOT EXISTS idx_interpretations_user_id ON public.interpretations(user_id);
