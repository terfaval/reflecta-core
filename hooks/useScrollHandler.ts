// hooks/useScrollHandler.ts
import { useEffect } from 'react';

interface UseScrollHandlerParams {
  ref: React.RefObject<HTMLElement>;
  loading: boolean;
  onNearTop: () => void;
  onScrollBottomStateChange: (show: boolean) => void;
}

export function useScrollHandler({
  ref,
  loading,
  onNearTop,
  onScrollBottomStateChange,
}: UseScrollHandlerParams) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const nearTop = el.scrollTop < 50;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      onScrollBottomStateChange(!nearBottom);
      if (nearTop && !loading) {
        onNearTop();
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [ref, loading, onNearTop, onScrollBottomStateChange]);
}
