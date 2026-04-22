import { useEffect, useRef, useCallback } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay: number): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => { callbackRef.current = callback; }, [callback]);
  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  }, [delay]);
}

interface AutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => void | Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ data, onSave, delay = 500, enabled = true }: AutoSaveOptions<T>): { isSaving: boolean; lastSaved: Date | null } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);
  const dataRef = useRef(data);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try { await onSave(dataRef.current); lastSavedRef.current = new Date(); }
      catch (error) { console.error('Auto-save failed:', error); }
      finally { isSavingRef.current = false; }
    }, delay);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [data, onSave, delay, enabled]);

  return { isSaving: isSavingRef.current, lastSaved: lastSavedRef.current };
}
