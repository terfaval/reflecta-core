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
  const visibleCount = 4;

  const maxIndex = Math.max(0, profiles.length - visibleCount);

  const prev = useCallback(
    () => setIndex((i) => Math.max(0, i - 1)),
    [],
  );
  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, maxIndex)),
    [maxIndex],
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    function update() {
      if (!trackRef.current || !containerRef.current) return;
      const style = window.getComputedStyle(trackRef.current);
      const gap = parseFloat(style.gap || "0");
      const containerWidth = containerRef.current.offsetWidth;
      const cardWidth =
        (containerWidth - gap * (visibleCount - 1)) / visibleCount;
      trackRef.current.style.setProperty("--card-width", `${cardWidth}px`);
      setItemWidth(cardWidth + gap);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [profiles.length]);

  // Always show four cards regardless of viewport size

  const swipeHandlers = useSwipeable({
    onSwipeStart: () => setDragging(true),
    onSwiped: ({ dir, deltaX }) => {
      const threshold = itemWidth / 3;
      const distance = Math.abs(deltaX);
      if (dir === "Left" && distance > threshold) next();
      else if (dir === "Right" && distance > threshold) prev();
      setDragX(0);
      setDragging(false);
    },
    onSwiping: ({ deltaX }) => setDragX(deltaX),
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

  return (
    <div className={styles.carousel} tabIndex={0} ref={containerRef}>
      <button
        onClick={prev}
        disabled={index === 0}
        className={`${styles.arrow} ${styles.left}`}
        aria-label="Előző"
      >
        <ChevronLeft />
      </button>
      <div className={styles.viewport} {...swipeHandlers}>
        <div
          className={`${styles.track} ${dragging ? styles.dragging : ""}`}
          ref={trackRef}
          style={{ transform: `translateX(${-index * itemWidth + dragX}px)` }}
        >
          {profiles.map((p) => (
            <ProfileCardComponent
              key={p.name}
              {...p}
              onSelect={() => onSelect(p)}
            />
          ))}
        </div>
      </div>
      <button
        onClick={next}
        disabled={index === maxIndex}
        className={`${styles.arrow} ${styles.right}`}
        aria-label="Következő"
      >
        <ChevronRight />
      </button>
    </div>
  );
}