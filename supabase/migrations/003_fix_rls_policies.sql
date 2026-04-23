-- Fix RLS policies to ensure authenticated users can CRUD their own data
-- This migration makes policies more explicit and permissive for the data owner

-- ============================================
-- WORKSPACES
-- ============================================

-- Drop existing workspace policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete own workspaces" ON public.workspaces;

-- Allow authenticated users to view workspaces they own or are members of
CREATE POLICY "Users can view workspaces"
    ON public.workspaces
    FOR SELECT
    USING (owner_id = auth.uid());

-- Allow authenticated users to create workspaces (must set themselves as owner)
CREATE POLICY "Users can insert workspaces"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Allow owners to update their workspaces
CREATE POLICY "Users can update workspaces"
    ON public.workspaces
    FOR UPDATE
    USING (owner_id = auth.uid());

-- Allow owners to delete their workspaces
CREATE POLICY "Users can delete workspaces"
    ON public.workspaces
    FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================
-- PAGES
-- ============================================

-- Drop existing page policies
DROP POLICY IF EXISTS "Users can view pages" ON public.pages;
DROP POLICY IF EXISTS "Users can insert pages" ON public.pages;
DROP POLICY IF EXISTS "Users can update pages" ON public.pages;
DROP POLICY IF EXISTS "Users can delete pages" ON public.pages;

-- Allow viewing pages in workspaces owned by the user
CREATE POLICY "Users can view pages"
    ON public.pages
    FOR SELECT
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));

-- Allow inserting pages into owned workspaces
CREATE POLICY "Users can insert pages"
    ON public.pages
    FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));

-- Allow updating pages in owned workspaces (includes is_favorite toggle)
CREATE POLICY "Users can update pages"
    ON public.pages
    FOR UPDATE
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));

-- Allow deleting pages in owned workspaces
CREATE POLICY "Users can delete pages"
    ON public.pages
    FOR DELETE
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));

-- ============================================
-- BLOCKS
-- ============================================

-- Drop existing block policies
DROP POLICY IF EXISTS "Users can view blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can insert blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete blocks" ON public.blocks;

-- Allow viewing blocks in pages that belong to owned workspaces
CREATE POLICY "Users can view blocks"
    ON public.blocks
    FOR SELECT
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    ));

-- Allow inserting blocks into pages in owned workspaces
CREATE POLICY "Users can insert blocks"
    ON public.blocks
    FOR INSERT
    WITH CHECK (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    ));

-- Allow updating blocks in pages in owned workspaces
CREATE POLICY "Users can update blocks"
    ON public.blocks
    FOR UPDATE
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    ));

-- Allow deleting blocks in pages in owned workspaces
CREATE POLICY "Users can delete blocks"
    ON public.blocks
    FOR DELETE
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    ));
