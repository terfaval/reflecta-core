import React, { useState } from 'react';
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    trackMouse: true,
  });

  const visible = Array.from({ length: visibleCount }, (_, idx) => {
    return profiles[(index + idx) % profiles.length];
  });

  return (
    <div className={styles.carousel}>
      <button onClick={prev} className={`${styles.arrow} ${styles.left}`} aria-label="Előző">
        <ChevronLeft />
      </button>
      <div className={styles.track} {...swipeHandlers}>
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