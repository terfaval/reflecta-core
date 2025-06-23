import React, { useState, useRef, useLayoutEffect } from 'react';
import ProfileCardComponent, { ProfileCardProps } from './ProfileCard';
import styles from './ProfileCarousel.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

export interface ProfileCard extends Omit<ProfileCardProps, 'onSelect'> {}

interface Props {
  profiles: ProfileCard[];
  onSelect: (p: ProfileCard) => void;
}

export default function ProfileCarousel({ profiles, onSelect }: Props) {
  const [index, setIndex] = useState(0);
  const visibleCount = 4;

  const prev = () => setIndex(i => (i - 1 + profiles.length) % profiles.length);
  const next = () => setIndex(i => (i + 1) % profiles.length);

  const trackRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [dragX, setDragX] = useState(0);

  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const first = trackRef.current.children[0] as HTMLElement | undefined;
    if (!first) return;
    const style = window.getComputedStyle(trackRef.current);
    const gap = parseFloat(style.gap || '0');
    setItemWidth(first.offsetWidth + gap);
  }, [profiles.length]);

  const swipeHandlers = useSwipeable({
    onSwiped: ({ dir, deltaX }) => {
      const threshold = itemWidth / 3;
      if (dir === 'Left' && deltaX > threshold) next();
      else if (dir === 'Right' && deltaX > threshold) prev();
      setDragX(0);
    },
    onSwiping: ({ deltaX }) => setDragX(-deltaX),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });
  
  const visible = Array.from({ length: visibleCount }, (_, idx) => {
    return profiles[(index + idx) % profiles.length];
  });

  return (
    <div className={styles.carousel}>
      <button onClick={prev} className={`${styles.arrow} ${styles.left}`} aria-label="Előző">
        <ChevronLeft />
      </button>
      <div
        className={styles.track}
        ref={trackRef}
        style={{ transform: `translateX(${ -index * itemWidth + dragX }px)` }}
        {...swipeHandlers}
      >
        {visible.map(p => (
          <ProfileCardComponent key={p.name} {...p} onSelect={() => onSelect(p)} />
        ))}
      </div>
      <button onClick={next} className={`${styles.arrow} ${styles.right}`} aria-label="Következő">
        <ChevronRight />
      </button>
    </div>
  );
}