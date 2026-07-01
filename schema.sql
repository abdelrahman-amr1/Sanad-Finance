-- SQL Schema for Sanad Finance (Multi-Tenant SaaS Legal & Tax System)
-- Execute this script in your Supabase SQL Editor.
-- WARNING: This will drop existing tables and rebuild them with the new multi-tenant SaaS schema.

-- Enable pgvector extension for AI semantic search RAG pipeline
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================================
-- 1. DROP EXISTING TABLES (Cascading to clean up references and policies)
-- =========================================================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.committees CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.tax_laws CASCADE;

-- =========================================================================
-- 2. CREATE TABLES (Dependencies ordered: Parent tables first)
-- =========================================================================

-- A. Organizations (Tenants)
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- e.g. sameh-samir-ab-team
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- B. Profiles (Linked to Supabase Auth Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'consultant', 'staff')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- C. Clients
CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    tax_card_number TEXT NOT NULL, 
    file_number TEXT NOT NULL,     
    mobile TEXT,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- D. Committees (لجان الفحص والطعن)
CREATE TABLE public.committees (
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

-- E. Tasks (المهام وجدول المواعيد)
CREATE TABLE public.tasks (
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

-- F. Audit Trail Logs (سجل العمليات)
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- G. Tax Laws (Global search table)
CREATE TABLE public.tax_laws (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    law_number TEXT NOT NULL,
    law_year TEXT NOT NULL,
    law_type TEXT NOT NULL,
    article_number TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_laws ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. CREATE POLICIES (All tables exist, safely create relations)
-- =========================================================================

-- Organizations Policies
DROP POLICY IF EXISTS "Allow public read access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Allow super_admins to manage organizations" ON public.organizations;
CREATE POLICY "Allow public read access to organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow super_admins to manage organizations" ON public.organizations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Profiles Policies
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow super_admins to manage profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow super_admins to manage profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Clients Policies
DROP POLICY IF EXISTS "Allow users to read their own organization's clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admins/consultants to manage clients" ON public.clients;
CREATE POLICY "Allow users to read their own organization's clients" ON public.clients FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);
CREATE POLICY "Allow admins/consultants to manage clients" ON public.clients FOR ALL USING (
    (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) 
     AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'consultant')))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Committees Policies
DROP POLICY IF EXISTS "Allow users to read their own organization's committees" ON public.committees;
DROP POLICY IF EXISTS "Allow admins/consultants to manage committees" ON public.committees;
CREATE POLICY "Allow users to read their own organization's committees" ON public.committees FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);
CREATE POLICY "Allow admins/consultants to manage committees" ON public.committees FOR ALL USING (
    (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'consultant')))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Tasks Policies
DROP POLICY IF EXISTS "Allow users to manage tasks" ON public.tasks;
CREATE POLICY "Allow users to manage tasks" ON public.tasks FOR ALL USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Audit Logs Policies
DROP POLICY IF EXISTS "Allow admins to read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insertion of audit logs for system operations" ON public.audit_logs;
CREATE POLICY "Allow admins to read audit logs" ON public.audit_logs FOR SELECT USING (
    (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);
CREATE POLICY "Allow insertion of audit logs for system operations" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Tax Laws Policies
DROP POLICY IF EXISTS "Allow authenticated read tax laws" ON public.tax_laws;
DROP POLICY IF EXISTS "Allow super_admin to manage tax laws" ON public.tax_laws;
CREATE POLICY "Allow authenticated read tax laws" ON public.tax_laws FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow super_admin to manage tax laws" ON public.tax_laws FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- =========================================================================
-- 5. CREATE FUNCTIONS
-- =========================================================================
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
