import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import ProfileCardComponent, { ProfileCardProps } from "./ProfileCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ProfileCarousel.module.css";

export interface ProfileCardData extends Omit<ProfileCardProps, "onSelect"> {}

interface Props {
  profiles: ProfileCardData[];
  onSelect: (p: ProfileCardData) => void;
}

export default function ProfileCarousel({ profiles, onSelect }: Props) {
  const visibleCount = 4;
  const gap = 16; // keep in sync with CSS gap

  const enableNav = profiles.length > visibleCount;
  const cloneBefore = enableNav ? profiles.slice(-visibleCount) : [];
  const cloneAfter = enableNav ? profiles.slice(0, visibleCount) : [];
  const items = enableNav ? [...cloneBefore, ...profiles, ...cloneAfter] : profiles;

  const startIndex = enableNav ? visibleCount : 0;
  const endIndex = enableNav ? profiles.length + visibleCount : profiles.length;

  const [index, setIndex] = useState(startIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);

  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const startTime = useRef(0);

  const prev = () => enableNav && setIndex((i) => i - 1);
  const next = () => enableNav && setIndex((i) => i + 1);

  useLayoutEffect(() => {
    function update() {
      if (!containerRef.current || !trackRef.current) return;
      const w = containerRef.current.offsetWidth;
      const width = (w - gap * (visibleCount - 1)) / visibleCount;
      setItemWidth(width);
      trackRef.current.style.setProperty("--card-width", `${width}px`);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [profiles.length]);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!enableNav) return;
    const el = trackRef.current;
    if (!el) return;

    const handle = () => {
      if (index >= endIndex || index < startIndex) {
        el.style.transition = "none";
        const newIndex = index >= endIndex ? startIndex : index + profiles.length;
        setIndex(newIndex);
        el.style.transform = `translateX(${-newIndex * (itemWidth + gap)}px)`;
        requestAnimationFrame(() => {
          if (el) el.style.transition = "";
        });
      }
    };

    el.addEventListener("transitionend", handle);
    return () => el.removeEventListener("transitionend", handle);
  }, [index, endIndex, startIndex, itemWidth, gap, enableNav, profiles.length]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enableNav) return;
    setDragging(true);
    startX.current = e.clientX;
    startTime.current = e.timeStamp;
    setDragX(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    setDragX(delta);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startX.current;
    const time = e.timeStamp - startTime.current || 1;
    const velocity = Math.abs(delta) / time;
    const threshold = itemWidth / 5;
    setDragging(false);
    setDragX(0);
    if (delta < 0 && (Math.abs(delta) > threshold || velocity > 0.2)) next();
    else if (delta > 0 && (Math.abs(delta) > threshold || velocity > 0.2)) prev();
  };

  const transform = `translateX(${dragX - index * (itemWidth + gap)}px)`;

  return (
    <div className={styles.carousel} ref={containerRef}>
      {enableNav && (
        <button className={`${styles.arrow} ${styles.left}`} onClick={prev} aria-label="Előző">
          <ChevronLeft />
        </button>
      )}
        <div className={styles.viewport}>
        <div
          className={`${styles.track} ${dragging ? styles.dragging : ""}`}
          ref={trackRef}
          style={{ transform }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {items.map((p, idx) => (
            <div key={idx} className={styles.card}>
              <ProfileCardComponent {...p} onSelect={() => onSelect(p)} />
            </div>
          ))}
        </div>
      </div>
      {enableNav && (
        <button className={`${styles.arrow} ${styles.right}`} onClick={next} aria-label="Következő">
          <ChevronRight />
        </button>
      )}
    </div>
  );
}