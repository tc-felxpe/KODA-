/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitize: remove whitespace, newlines, and zero-width chars
const supabaseUrl = rawUrl.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
const supabaseAnonKey = rawKey.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

// DEBUG: Show exact values in browser console (safe preview)
console.log('[KODA DEBUG] SUPABASE_URL length:', supabaseUrl.length);
console.log('[KODA DEBUG] SUPABASE_URL chars:', supabaseUrl.split('').map(c => c.charCodeAt(0)));
console.log('[KODA DEBUG] SUPABASE_URL value:', supabaseUrl);
console.log('[KODA DEBUG] SUPABASE_ANON_KEY length:', supabaseAnonKey.length);
console.log('[KODA DEBUG] SUPABASE_ANON_KEY first 20 chars:', supabaseAnonKey.slice(0, 20));

// Detect non-ASCII characters
const nonAsciiInUrl = supabaseUrl.split('').filter((c, i) => {
  const code = c.charCodeAt(0);
  if (code > 127) {
    console.log(`[KODA DEBUG] Non-ASCII char in URL at pos ${i}: U+${code.toString(16).toUpperCase().padStart(4, '0')} = "${c}"`);
    return true;
  }
  return false;
});

const nonAsciiInKey = supabaseAnonKey.split('').filter((c, i) => {
  const code = c.charCodeAt(0);
  if (code > 127) {
    console.log(`[KODA DEBUG] Non-ASCII char in KEY at pos ${i}: U+${code.toString(16).toUpperCase().padStart(4, '0')} = "${c}"`);
    return true;
  }
  return false;
});

console.log('[KODA DEBUG] Non-ASCII in URL:', nonAsciiInUrl.length);
console.log('[KODA DEBUG] Non-ASCII in KEY:', nonAsciiInKey.length);

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
