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
  const containerRef = useRef<HTMLDivElement>(null);

  const getVisibleCount = useCallback(() => {
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    if (width < 480) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    return 4;
  }, []);

  const [visibleCount, setVisibleCount] = useState(getVisibleCount);

  const computeItems = useCallback(
    (count: number) => {
      const clamp = Math.min(count, profiles.length);
      const before = profiles.slice(-clamp);
      const after = profiles.slice(0, clamp);
      return { items: [...before, ...profiles, ...after], start: clamp, end: profiles.length + clamp };
    },
    [profiles]
  );

  const { items, start: startIndex, end: endIndex } = computeItems(visibleCount);

  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(() => setIndex((i) => i - 1), []);
  const next = useCallback(() => setIndex((i) => i + 1), []);

  const trackRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    function update() {
      if (!trackRef.current || !containerRef.current) return;
      const count = getVisibleCount();
      setVisibleCount(count);
      const style = window.getComputedStyle(trackRef.current);
      const gap = parseFloat(style.gap || "0");
      const containerWidth = containerRef.current.offsetWidth;
      const cardWidth = (containerWidth - gap * (count - 1)) / count;
      trackRef.current.style.setProperty("--card-width", `${cardWidth}px`);
      setItemWidth(cardWidth + gap);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [profiles.length, getVisibleCount]);

  useEffect(() => {
    setIndex(startIndex);
  }, [profiles.length, startIndex]);

  // Swipe handlers for dragging on touch devices

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
    const el = trackRef.current;
    if (!el) return;
    const handle = () => {
      if (index >= endIndex) {
        el.style.transition = "none";
        setIndex((i) => i - profiles.length);
        requestAnimationFrame(() => {
          if (el) el.style.transition = "";
        });
      } else if (index < startIndex) {
        el.style.transition = "none";
        setIndex((i) => i + profiles.length);
        requestAnimationFrame(() => {
          if (el) el.style.transition = "";
        });
      }
    };
    el.addEventListener("transitionend", handle);
    return () => el.removeEventListener("transitionend", handle);
  }, [index, endIndex, startIndex, profiles.length]);
  
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
          {items.map((p, idx) => (
            <ProfileCardComponent
              key={`${p.name}-${idx}`}
              {...p}
              onSelect={() => onSelect(p)}
            />
          ))}
        </div>
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