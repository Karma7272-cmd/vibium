import React from 'react';
import { cn } from '@/lib/utils';

type LoadingVariant = 'bars' | 'dots' | 'spinner' | 'skeleton' | 'pulse';
type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { bars: 'h-3 w-1', dots: 'w-1.5 h-1.5', spinner: 'w-4 h-4' },
  md: { bars: 'h-5 w-1.5', dots: 'w-2 h-2', spinner: 'w-6 h-6' },
  lg: { bars: 'h-7 w-2', dots: 'w-2.5 h-2.5', spinner: 'w-8 h-8' },
  xl: { bars: 'h-10 w-2.5', dots: 'w-3 h-3', spinner: 'w-12 h-12' },
};

const bars = (size: LoadingSize, className?: string) => (
  <div className={cn('flex items-center gap-1', className)}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className={cn('rounded-full bg-primary', sizeMap[size].bars)}
        style={{
          animation: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: `${i * 150}ms`,
        }}
      />
    ))}
  </div>
);

const dots = (size: LoadingSize, className?: string) => (
  <div className={cn('flex items-center gap-1.5', className)}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className={cn('rounded-full bg-primary', sizeMap[size].dots)}
        style={{
          animation: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: `${i * 150}ms`,
        }}
      />
    ))}
  </div>
);

const spinner = (size: LoadingSize, className?: string) => (
  <div className={cn('relative', sizeMap[size].spinner, className)}>
    <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
  </div>
);

const skeleton = (className?: string) => (
  <div className={cn('space-y-3 w-full', className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="h-12 rounded-md bg-muted animate-pulse"
        style={{ animationDelay: `${i * 150}ms` }}
      />
    ))}
  </div>
);

const pulse = (size: LoadingSize, className?: string) => {
  const scale = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-12 w-12' : size === 'lg' ? 'h-16 w-16' : 'h-20 w-20';
  return (
    <div className={cn('relative flex items-center justify-center', scale, className)}>
      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse" />
      <div className="relative h-3 w-3 rounded-full bg-primary" />
    </div>
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'bars',
  size = 'md',
  message,
  submessage,
  fullScreen = false,
  className = '',
}) => {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', fullScreen && 'min-h-[50vh]', className)}>
      {variant === 'bars' && bars(size)}
      {variant === 'dots' && dots(size)}
      {variant === 'spinner' && spinner(size)}
      {variant === 'skeleton' && skeleton()}
      {variant === 'pulse' && pulse(size)}
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse text-center">{message}</p>
      )}
      {submessage && (
        <p className="text-xs text-muted-foreground/70 text-center">{submessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState;
