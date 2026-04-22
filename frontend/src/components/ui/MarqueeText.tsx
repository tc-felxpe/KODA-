import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeTextProps {
  text: string;
  className?: string;
  containerClassName?: string;
}

export function MarqueeText({ text, className, containerClassName }: MarqueeTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setShouldAnimate(textWidth > containerWidth);
      }
    };

    // Esperar a que el DOM se actualice
    const timeoutId = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div 
      ref={containerRef}
      className={cn('overflow-hidden', containerClassName)}
    >
      <span
        ref={textRef}
        className={cn(
          'inline-block whitespace-nowrap',
          shouldAnimate && 'animate-marquee',
          className
        )}
        title={text}
      >
        {text}
      </span>
    </div>
  );
}
