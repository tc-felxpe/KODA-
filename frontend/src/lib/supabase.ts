/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// DEBUG INTERCEPTOR: Log all headers before they are set
const originalSet = Headers.prototype.set;
Headers.prototype.set = function(name: string, value: string) {
  try {
    // Check for non-ISO-8859-1 characters
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code > 255) {
        console.error(`[HEADER ERROR] Header "${name}" has non-ISO-8859-1 char at pos ${i}: U+${code.toString(16).toUpperCase()} = "${value[i]}"`);
        console.error(`[HEADER ERROR] Full value:`, value);
        console.error(`[HEADER ERROR] Char codes:`, value.split('').map((c) => c.charCodeAt(0)));
      }
    }
    return originalSet.call(this, name, value);
  } catch (err) {
    console.error(`[HEADER ERROR] Failed to set header "${name}"`);
    console.error(`[HEADER ERROR] Value:`, value);
    console.error(`[HEADER ERROR] Value length:`, value.length);
    console.error(`[HEADER ERROR] Char codes:`, value.split('').map((c) => c.charCodeAt(0)));
    throw err;
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[KODA DEBUG] URL length:', supabaseUrl.length, 'Key length:', supabaseAnonKey.length);

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
