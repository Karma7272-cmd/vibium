
import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'regular' | 'floating';
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ variant = 'regular', className = '' }) => {
  const baseClasses = "text-center py-2 sm:py-4";
  const variantClasses = variant === 'floating' 
    ? "absolute bottom-0 left-0 right-0 bg-background/60 dark:bg-background/10 backdrop-blur-sm border-t border-border/50"
    : "border-t border-border bg-background/80 dark:bg-background/20 backdrop-blur-sm";

  return (
    <footer className={`${baseClasses} ${variantClasses} ${className}`}>
      <p className="text-xs text-muted-foreground">
        Built with love · AI-powered code platform
      </p>
    </footer>
  );
};

export default Footer;
