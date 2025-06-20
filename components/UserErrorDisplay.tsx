import React from 'react';
import { RotateCw } from 'lucide-react';

interface UserErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export default function UserErrorDisplay({ message, onRetry }: UserErrorDisplayProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <p className="mb-6 text-lg font-bold">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-base bg-transparent border-none"
      >
        <RotateCw size={20} />
        <span>Próbáld újra</span>
      </button>
    </div>
  );
}