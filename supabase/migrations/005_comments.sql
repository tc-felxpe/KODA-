-- Comments system for pages
-- Users can comment on pages within workspaces they have access to

-- ============================================
-- 1. CREATE COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_page ON public.comments(page_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);

-- ============================================
-- 2. ENABLE RLS
-- ============================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Helper: check if user has access to a page's workspace
-- We reuse the same logic from pages/blocks policies

-- Users can view comments on pages they have access to
CREATE POLICY "Users can view comments"
    ON public.comments
    FOR SELECT
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    ));

-- Authenticated users can insert comments on pages they have access to
CREATE POLICY "Users can insert comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (user_id = auth.uid() AND page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    ));

-- Users can update only their own comments
CREATE POLICY "Users can update own comments"
    ON public.comments
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete only their own comments
CREATE POLICY "Users can delete own comments"
    ON public.comments
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- 4. AUTO-UPDATE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
