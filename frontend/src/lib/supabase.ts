import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSession = () => supabase.auth.getSession();
export const signUp = async (email: string, password: string) => supabase.auth.signUp({ email, password });
export const signIn = async (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOut = async () => supabase.auth.signOut();
export const onAuthStateChange = (callback: (event: string, session: unknown) => void) => supabase.auth.onAuthStateChange(callback);