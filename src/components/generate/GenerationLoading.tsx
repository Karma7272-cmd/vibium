import React from 'react';
import { Sparkles } from 'lucide-react';

interface GenerationLoadingProps {
  stage?: string;
  prompt?: string | null;
}

export const GenerationLoading: React.FC<GenerationLoadingProps> = ({
  stage = 'Generating...',
  prompt,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>

      <div className="space-y-3 text-center max-w-md">
        <h3 className="text-lg font-semibold">Generating your project</h3>
        <p className="text-sm text-muted-foreground animate-pulse">{stage}</p>
        {prompt && (
          <p className="text-xs text-muted-foreground/60 max-w-md truncate">&ldquo;{prompt}&rdquo;</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 pt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-primary"
            style={{
              height: i === 1 || i === 3 ? '1.5rem' : i === 2 ? '2rem' : '1rem',
              animation: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary/40 rounded-full"
              style={{
                width: `${35 + i * 15}%`,
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                animationDelay: `${i * 200}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenerationLoading;
