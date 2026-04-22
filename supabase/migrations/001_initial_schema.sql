-- KODA Database Schema for Supabase
-- SQL for Supabase migrations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📁',
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace memberships
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Pages table (hierarchical)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Untitled',
    icon TEXT DEFAULT '📄',
    cover_image TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('paragraph', 'heading-1', 'heading-2', 'heading-3', 'bullet-list', 'numbered-list', 'checklist', 'code', 'quote', 'divider', 'image')),
    content JSONB DEFAULT '{}',
    properties JSONB DEFAULT '{}',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_pages_workspace ON public.pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON public.pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page ON public.blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_position ON public.blocks(page_id, position);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces" ON public.workspaces FOR SELECT USING (owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own workspaces" ON public.workspaces FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for pages
CREATE POLICY "Users can view pages" ON public.pages FOR SELECT USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert pages" ON public.pages FOR INSERT WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));
CREATE POLICY "Users can update pages" ON public.pages FOR UPDATE USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));
CREATE POLICY "Users can delete pages" ON public.pages FOR DELETE USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));

-- RLS Policies for blocks
CREATE POLICY "Users can view blocks" ON public.blocks FOR SELECT USING (page_id IN (SELECT id FROM public.pages WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can insert blocks" ON public.blocks FOR INSERT WITH CHECK (page_id IN (SELECT id FROM public.pages WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));
CREATE POLICY "Users can update blocks" ON public.blocks FOR UPDATE USING (page_id IN (SELECT id FROM public.pages WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));
CREATE POLICY "Users can delete blocks" ON public.blocks FOR DELETE USING (page_id IN (SELECT id FROM public.pages WHERE workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor'))));

-- Function to create default workspace for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    INSERT INTO public.workspaces (id, name, owner_id)
    VALUES (uuid_generate_v4(), 'My Workspace', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();