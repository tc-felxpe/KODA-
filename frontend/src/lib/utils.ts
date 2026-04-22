import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: string | Date): string { return new Intl.DateTimeFormat('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)); }
export function formatRelativeTime(date: string | Date): string {
  const now = new Date(); const then = new Date(date); const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Justo ahora'; if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`; if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`; if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`; return formatDate(date);
}
export function generateId(): string { return crypto.randomUUID(); }
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null; return (...args: Parameters<T>) => { if (timeout) clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
}