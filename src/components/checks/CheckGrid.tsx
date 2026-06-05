
import React from 'react';
import { Check } from '@/types/check';
import CheckCard from './CheckCard';

interface CheckGridProps {
  checks: Check[];
  columns?: number;
}

const CheckGrid: React.FC<CheckGridProps> = ({ checks, columns = 6 }) => {
  return (
    <div 
      className="grid gap-2"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
      }}
    >
      {checks.map((check) => (
        <CheckCard key={check.id} check={check} variant="grid" />
      ))}
    </div>
  );
};

export default CheckGrid;
