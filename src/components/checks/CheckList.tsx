
import React from 'react';
import { Check } from '@/types/check';
import CheckCard from './CheckCard';

interface CheckListProps {
  checks: Check[];
}

const CheckList: React.FC<CheckListProps> = ({ checks }) => {
  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <CheckCard key={check.id} check={check} variant="list" />
      ))}
    </div>
  );
};

export default CheckList;
