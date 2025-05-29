// hooks/useAutoTextareaResize.ts
import { useEffect } from 'react';

export function useAutoTextareaResize() {
  useEffect(() => {
    const textarea = document.querySelector('.reflecta-input textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const handleInput = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    textarea.addEventListener('input', handleInput);
    return () => textarea.removeEventListener('input', handleInput);
  }, []);
}
