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
  const visibleCount = 4;
  const gap = 16; // px, keep in sync with CSS gap

  const enableNav = profiles.length > visibleCount;

  const clonesBefore = enableNav ? profiles.slice(-visibleCount) : [];
  const clonesAfter = enableNav ? profiles.slice(0, visibleCount) : [];
  const items = enableNav
    ? [...clonesBefore, ...profiles, ...clonesAfter]
    : profiles;

  const startIndex = enableNav ? visibleCount : 0;
  const endIndex = enableNav ? profiles.length + visibleCount : profiles.length;

  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(() => {
    if (enableNav) setIndex((i) => i - 1);
  }, [enableNav]);
  const next = useCallback(() => {
    if (enableNav) setIndex((i) => i + 1);
  }, [enableNav]);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    function update() {
      if (!containerRef.current || !trackRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const width =
        (containerWidth - gap * (visibleCount - 1)) / visibleCount;
      trackRef.current.style.setProperty("--card-width", `${width}px`);
      setItemWidth(width);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [profiles.length, gap]);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  const swipeHandlers = useSwipeable(
    enableNav
      ? {
          onSwipeStart: () => setDragging(true),
          onSwiped: ({ dir, deltaX, velocity }) => {
            const threshold = itemWidth / 5;
            const distance = Math.abs(deltaX);
            const fast = velocity > 0.2;
            if (dir === "Left" && (distance > threshold || fast)) next();
            else if (dir === "Right" && (distance > threshold || fast)) prev();
            setDragX(0);
            setDragging(false);
          },
          onSwiping: ({ deltaX }) => setDragX(deltaX),
          trackMouse: true,
          preventScrollOnSwipe: true,
        }
      : {}
  );

  useEffect(() => {
  if (!enableNav) return;
    const el = trackRef.current;
    if (!el) return;

    const handle = () => {
      el.style.transition = "none";

      if (index >= endIndex) {
        setIndex(startIndex);
        el.style.transform = `translateX(${-startIndex * (itemWidth + gap)}px)`;
      } else if (index < startIndex) {
        const newIndex = profiles.length + startIndex - 1;
        setIndex(newIndex);
        el.style.transform = `translateX(${-newIndex * (itemWidth + gap)}px)`;
      }

      requestAnimationFrame(() => {
        if (el) el.style.transition = "";
      });
    };

    el.addEventListener("transitionend", handle);
    return () => el.removeEventListener("transitionend", handle);
  }, [index, endIndex, startIndex, profiles.length, enableNav, itemWidth, gap]);
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", handleKey);
    return () => el.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  return (
    <div className={styles.carousel} tabIndex={0} ref={containerRef}>
      {enableNav && (
        <button
          onClick={prev}
          className={`${styles.arrow} ${styles.left}`}
          aria-label="Előző"
        >
          <ChevronLeft />
        </button>
      )}
      <div className={styles.viewport} {...swipeHandlers}>
        <div
          className={`${styles.track} ${dragging ? styles.dragging : ""}`}
          ref={trackRef}
          style={{ transform: `translateX(${dragX - index * (itemWidth + gap)}px)` }}
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
      {enableNav && (
        <button
          onClick={next}
          className={`${styles.arrow} ${styles.right}`}
          aria-label="Következő"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}