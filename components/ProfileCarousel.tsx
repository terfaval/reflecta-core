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
    if (!enableNav) return;
    setIndex((i) => i - 1);
  }, [enableNav]);
  const next = useCallback(() => {
    if (!enableNav) return;
    setIndex((i) => i + 1);
  }, [enableNav]);

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(1);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    function update() {
      if (!trackRef.current || !containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const computedCardWidth =
        (containerWidth - gap * (visibleCount - 1)) / visibleCount;
      trackRef.current.style.setProperty("--card-width", `${computedCardWidth}px`);
      setCardWidth(computedCardWidth)
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [profiles.length, gap]);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  // Always show four cards regardless of viewport size

  const swipeHandlers = useSwipeable(
    enableNav
      ? {
          onSwipeStart: () => setDragging(true),
          onSwiped: ({ dir, deltaX, velocity }) => {
            const threshold = cardWidth / 5;
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
  }, [index, endIndex, startIndex, profiles.length, enableNav]);
  
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
          style={{
            transform: `translateX(${dragX - index * (cardWidth + gap)}px)`,
          }}
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