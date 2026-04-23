-- Fix: Add workspace_members on user creation and update RLS policies
-- This ensures creators are always recognized as members with 'owner' role

-- ============================================
-- 1. UPDATE TRIGGER: Insert workspace_members
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert default workspace and capture its ID
    INSERT INTO public.workspaces (name, owner_id)
    VALUES ('Mi espacio de trabajo', NEW.id)
    RETURNING id INTO new_workspace_id;
    
    -- Insert owner into workspace_members (CRITICAL for RLS policies)
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, NEW.id, 'owner');
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. BACKFILL: Add existing workspace owners to workspace_members
-- ============================================

INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'owner'
FROM public.workspaces w
LEFT JOIN public.workspace_members wm ON w.id = wm.workspace_id AND w.owner_id = wm.user_id
WHERE wm.id IS NULL;

-- ============================================
-- 3. FIX RLS POLICIES: Use workspace_members as primary check
-- ============================================

-- WORKSPACES
DROP POLICY IF EXISTS "Users can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete workspaces" ON public.workspaces;

CREATE POLICY "Users can view workspaces"
    ON public.workspaces
    FOR SELECT
    USING (owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert workspaces"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update workspaces"
    ON public.workspaces
    FOR UPDATE
    USING (owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Users can delete workspaces"
    ON public.workspaces
    FOR DELETE
    USING (owner_id = auth.uid() OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner'));

-- PAGES
DROP POLICY IF EXISTS "Users can view pages" ON public.pages;
DROP POLICY IF EXISTS "Users can insert pages" ON public.pages;
DROP POLICY IF EXISTS "Users can update pages" ON public.pages;
DROP POLICY IF EXISTS "Users can delete pages" ON public.pages;

CREATE POLICY "Users can view pages"
    ON public.pages
    FOR SELECT
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert pages"
    ON public.pages
    FOR INSERT
    WITH CHECK (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

CREATE POLICY "Users can update pages"
    ON public.pages
    FOR UPDATE
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

CREATE POLICY "Users can delete pages"
    ON public.pages
    FOR DELETE
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        UNION
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

-- BLOCKS
DROP POLICY IF EXISTS "Users can view blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can insert blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can update blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete blocks" ON public.blocks;

CREATE POLICY "Users can view blocks"
    ON public.blocks
    FOR SELECT
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert blocks"
    ON public.blocks
    FOR INSERT
    WITH CHECK (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    ));

CREATE POLICY "Users can update blocks"
    ON public.blocks
    FOR UPDATE
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    ));

CREATE POLICY "Users can delete blocks"
    ON public.blocks
    FOR DELETE
    USING (page_id IN (
        SELECT id FROM public.pages WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    ));

-- WORKSPACE_MEMBERS
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can update workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can delete workspace members" ON public.workspace_members;

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace members"
    ON public.workspace_members
    FOR SELECT
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Users can insert workspace members"
    ON public.workspace_members
    FOR INSERT
    WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update workspace members"
    ON public.workspace_members
    FOR UPDATE
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete workspace members"
    ON public.workspace_members
    FOR DELETE
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));
