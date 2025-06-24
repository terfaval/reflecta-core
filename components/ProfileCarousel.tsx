import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import ProfileCardComponent, { ProfileCardProps } from "./ProfileCard";
import styles from "./ProfileCarousel.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeable } from "react-swipeable";

export interface ProfileCardData extends Omit<ProfileCardProps, "onSelect"> {}

interface Props {
  profiles: ProfileCardData[];
  onSelect: (p: ProfileCardData) => void;
}

export default function ProfileCarousel({ profiles, onSelect }: Props) {
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + profiles.length) % profiles.length),
    [profiles.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % profiles.length),
    [profiles.length],
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);
  const [dragX, setDragX] = useState(0);

  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const first = trackRef.current.children[0] as HTMLElement | undefined;
    if (!first) return;
    const style = window.getComputedStyle(trackRef.current);
    const gap = parseFloat(style.gap || "0");
    setItemWidth(first.offsetWidth + gap);
  }, [profiles.length]);

  const updateVisible = useCallback(() => {
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    const count = Math.max(1, Math.min(4, Math.floor(width / itemWidth)));
    setVisibleCount(count);
  }, [itemWidth]);

  useLayoutEffect(() => {
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, [updateVisible]);

  const swipeHandlers = useSwipeable({
    onSwiped: ({ dir, deltaX }) => {
      const threshold = itemWidth / 3;
      const distance = Math.abs(deltaX);
      if (dir === "Left" && deltaX > threshold) next();
      else if (dir === "Right" && deltaX > threshold) prev();
      setDragX(0);
    },
    onSwiping: ({ deltaX }) => setDragX(-deltaX),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", handleKey);
    return () => el.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  const visible = Array.from({ length: visibleCount }, (_, idx) => {
    return profiles[(index + idx) % profiles.length];
  });

  return (
    <div className={styles.carousel} tabIndex={0} ref={containerRef}>
      <button
        onClick={prev}
        className={`${styles.arrow} ${styles.left}`}
        aria-label="Előző"
      >
        <ChevronLeft />
      </button>
      <div
        className={styles.track}
        ref={trackRef}
        style={{ transform: `translateX(${-index * itemWidth + dragX}px)` }}
        {...swipeHandlers}
      >
        {visible.map((p) => (
          <ProfileCardComponent
            key={p.name}
            {...p}
            onSelect={() => onSelect(p)}
          />
        ))}
      </div>
      <button
        onClick={next}
        className={`${styles.arrow} ${styles.right}`}
        aria-label="Következő"
      >
        <ChevronRight />
      </button>
    </div>
  );
}