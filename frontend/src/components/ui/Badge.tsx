import { cn } from '@/lib/utils';

type BadgeVariant = 'purple' | 'success' | 'warning' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  purple: 'bg-koda-purple-pastel text-koda-purple-dark',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  neutral: 'bg-gray-100 text-gray-600',
};

export function Badge({ children, variant = 'purple', className }: BadgeProps) {
  return (
    <span className={cn('koda-badge', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
