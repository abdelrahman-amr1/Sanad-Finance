-- SQL Schema for Sanad Finance (Multi-Tenant SaaS Legal & Tax System)
-- Execute this script in your Supabase SQL Editor.

-- Enable pgvector extension for AI semantic search RAG pipeline
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Organizations Table (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. sameh-samir-ab-team
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow super_admins to manage organizations" ON public.organizations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 2. Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'consultant', 'staff')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow super_admins to manage profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    tax_card_number TEXT NOT NULL, -- (Isolated by organization_id, doesn't need global unique constraint)
    file_number TEXT NOT NULL,     
    mobile TEXT,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Clients (Tenant isolation)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own organization's clients" ON public.clients FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Allow admins/consultants to manage clients" ON public.clients FOR ALL USING (
    (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) 
     AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'consultant')))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 4. Committees Table (لجان الفحص والطعن)
CREATE TABLE IF NOT EXISTS public.committees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('معاينة', 'فحص', 'طعن', 'قرار نهائي')),
    subject TEXT NOT NULL,
    tax_authority TEXT NOT NULL,
    disputed_amount NUMERIC(15, 2) DEFAULT 0.0,
    tax_years TEXT NOT NULL,
    hearing_date TIMESTAMP WITH TIME ZONE,
    room_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Committees (Tenant isolation)
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own organization's committees" ON public.committees FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Allow admins/consultants to manage committees" ON public.committees FOR ALL USING (
    (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'consultant')))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 5. Tasks Table (المهام وجدول المواعيد)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES public.profiles(id),
    committee_id UUID REFERENCES public.committees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Tasks (Tenant isolation)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage tasks" ON public.tasks FOR ALL USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 6. Audit Trail Logs (سجل العمليات)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Audit Logs (Tenant isolation)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to read audit logs" ON public.audit_logs FOR SELECT USING (
    (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Allow insertion of audit logs for system operations" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 7. Tax Laws Table (مخزن القوانين للبحث الدلالي RAG - Global across all tenants)
CREATE TABLE IF NOT EXISTS public.tax_laws (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    law_number TEXT NOT NULL,
    law_year TEXT NOT NULL,
    law_type TEXT NOT NULL,
    article_number TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Tax Laws (Read is global)
ALTER TABLE public.tax_laws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read tax laws" ON public.tax_laws FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow super_admin to manage tax laws" ON public.tax_laws FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 8. Cosine Similarity Function for vector search
CREATE OR REPLACE FUNCTION match_laws (
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    law_number TEXT,
    law_year TEXT,
    law_type TEXT,
    article_number TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tax_laws.id,
        tax_laws.law_number,
        tax_laws.law_year,
        tax_laws.law_type,
        tax_laws.article_number,
        tax_laws.content,
        1 - (tax_laws.embedding <=> query_embedding) AS similarity
    FROM tax_laws
    WHERE 1 - (tax_laws.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
