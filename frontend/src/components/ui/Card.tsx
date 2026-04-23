import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noShadow?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  id?: string;
  title?: string;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ hover = false, padding = 'md', noShadow = false, className, children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'bg-white rounded-xl border border-koda-border-soft',
        !noShadow && 'shadow-card',
        hover && 'hover:shadow-card-hover hover:border-koda-border transition-all duration-300',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
