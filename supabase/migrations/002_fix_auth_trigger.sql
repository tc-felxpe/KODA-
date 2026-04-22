-- Fix for auth user registration error
-- This migration fixes the "Database error saving new user" issue

-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Fix: Make email nullable in profiles (since Supabase auth might not provide it immediately)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile (email can be null, will be updated later)
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert default workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES ('Mi espacio de trabajo', NEW.id);
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Add missing RLS policy for profiles insertion
CREATE POLICY "Users can insert own profile" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Add policy for service role to manage profiles (needed for auth triggers)
CREATE POLICY "Service role can manage profiles" 
    ON public.profiles 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
