/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton pattern to avoid multiple GoTrueClient instances during HMR
const globalWindow = globalThis as unknown as { __supabaseClient?: ReturnType<typeof createClient> };

export const supabase = globalWindow.__supabaseClient ?? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

globalWindow.__supabaseClient = supabase;

export const getSession = () => supabase.auth.getSession();
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
};
export const signUp = async (email: string, password: string) => supabase.auth.signUp({ email, password });
export const signIn = async (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOut = async () => supabase.auth.signOut();
export const onAuthStateChange = (callback: (event: string, session: unknown) => void) => supabase.auth.onAuthStateChange(callback);
