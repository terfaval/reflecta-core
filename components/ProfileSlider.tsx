import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import ProfileCard, { ProfileCardProps } from './ProfileCard';
import styles from './ProfileSlider.module.css';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { apiFetch } from '@/lib/api';
import { profileStyles } from '@/styles/profileStyles';

export interface ProfileCardData
  extends Omit<ProfileCardProps, 'onSelect'> {
  personal?: boolean;
}

const BASE_ORDER = [
  'Reflecta',
  'Akasza',
  'Éana',
  'Luma',
  'Sylva',
  'Zentó',
  'Oneiros',
  'Kairos',
  'Noe',
];

const ICON_MAP: Record<string, string | undefined> = {
  Reflecta: 'ReflectaIcon',
  Akasza: 'AkaszaIcon',
  'Éana': 'EanaIcon',
  Luma: 'LumaIcon',
  Sylva: 'SylvaIcon',
  'Zentó': 'ZentoIcon',
  Oneiros: 'OneirosIcon',
  Kairos: 'KairosIcon',
  Noe: 'NoeIcon',
  Solun: 'SolunIcon',
  Preceptor: 'PreceptorIcon',
};

const BLANK_DESC =
  'Alap naplóprofil, ha csak egyszerűen írnál, mindenféle irány nélkül.';

export default function ProfileSlider() {
  const { userId } = useUserContext();
  const { setProfile } = useProfileContext();
  const router = useRouter();

  const [profiles, setProfiles] = useState<ProfileCardData[]>([]);

  const visibleCount = 4;
  const gap = 16;

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);
  const [index, setIndex] = useState(visibleCount);

  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const names = BASE_ORDER;
        const meta = await apiFetch<{
          profiles: any[];
          personalProfiles?: string[];
          error?: string;
        }>('/api/profile-list', {
          method: 'POST',
          body: JSON.stringify({ userId, names }),
        });
        if (meta.profiles) {
          const map: Record<string, { description: string; color: string; role?: string }> = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = {
              description: p.description,
              color: p.color,
              role: p.role,
            };
          });
          const makeCard = (name: string, personal = false): ProfileCardData => {
            const style =
              profileStyles[name] ||
              profileStyles[name.toLowerCase()] || {
                '--user-color': '#000',
                '--bg-color': '#fff',
              };
            return {
              name,
              iconName: ICON_MAP[name],
              description: map[name]?.description || (name === 'Reflecta' ? BLANK_DESC : ''),
              color: map[name]?.color || '#fff',
              role: map[name]?.role || '',
              userColor: style['--user-color'],
              bgColor: style['--bg-color'],
              personal,
            };
          };
          const personalNames = meta.personalProfiles || [];
          const cards: ProfileCardData[] = [];
          BASE_ORDER.forEach((n) => {
            if (n === 'Reflecta') {
              cards.push(makeCard(n));
              personalNames.forEach((pn) => {
                if (!BASE_ORDER.includes(pn)) {
                  cards.push(makeCard(pn, true));
                }
              });
            } else if (!personalNames.includes(n)) {
              cards.push(makeCard(n));
            }
          });
          setProfiles(cards);
          if (cards.length <= visibleCount) setIndex(0);
        } else {
          console.error('[profile-list]', meta.error);
        }
      } catch (err) {
        console.error('[profile-list fetch]', err);
      }
    };
    load();
  }, [userId]);

  const enableNav = profiles.length > visibleCount;
  const cloneBefore = enableNav ? profiles.slice(-visibleCount) : [];
  const cloneAfter = enableNav ? profiles.slice(0, visibleCount) : [];
  const items = enableNav ? [...cloneBefore, ...profiles, ...cloneAfter] : profiles;
  const startIndex = enableNav ? visibleCount : 0;
  const endIndex = enableNav ? profiles.length + visibleCount : profiles.length;

  useLayoutEffect(() => {
    function update() {
      if (!containerRef.current || !trackRef.current) return;
      const w = containerRef.current.offsetWidth;
      const width = (w - gap * (visibleCount - 1)) / visibleCount;
      setItemWidth(width);
      trackRef.current.style.setProperty('--card-width', `${width}px`);
      const start = enableNav ? visibleCount : 0;
      trackRef.current.style.transform = `translateX(${-start * (width + gap)}px)`;
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [profiles.length, enableNav]);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!enableNav) return;
    const el = trackRef.current;
    if (!el) return;
    const handle = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'transform') return;
      if (index >= endIndex || index < startIndex) {
        el.style.transition = 'none';
        const newIndex = index >= endIndex ? startIndex : index + profiles.length;
        setIndex(newIndex);
        el.style.transform = `translateX(${-newIndex * (itemWidth + gap)}px)`;
        requestAnimationFrame(() => {
          if (el) el.style.transition = '';
        });
      }
    };
    el.addEventListener('transitionend', handle);
    return () => el.removeEventListener('transitionend', handle);
  }, [index, endIndex, startIndex, itemWidth, gap, enableNav, profiles.length]);

  const prev = () => enableNav && setIndex((i) => i - 1);
  const next = () => enableNav && setIndex((i) => i + 1);

  const startDrag = (x: number, time: number) => {
    if (!enableNav) return;
    setDragging(true);
    startX.current = x;
    startTime.current = time;
    setDragX(0);
  };

  const moveDrag = (x: number) => {
    if (!dragging) return;
    const delta = x - startX.current;
    setDragX(delta);
  };

  const finishDrag = (x: number, time: number) => {
    if (!dragging) return;
    const delta = x - startX.current;
    const elapsed = time - startTime.current || 1;
    const velocity = Math.abs(delta) / elapsed;
    const threshold = itemWidth / 5;
    let steps = Math.floor(Math.abs(delta) / (itemWidth + gap));
    if (steps === 0 && (Math.abs(delta) > threshold || velocity > 0.2)) steps = 1;
    setDragging(false);
    setDragX(0);
    if (delta < 0 && steps) setIndex((i) => i + steps);
    else if (delta > 0 && steps) setIndex((i) => i - steps);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startDrag(e.clientX, e.timeStamp);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    moveDrag(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    finishDrag(e.clientX, e.timeStamp);
  };

  const transform = `translateX(${dragX - index * (itemWidth + gap)}px)`;

  const handleSelect = async (p: ProfileCardData) => {
    if (!userId) return;
    try {
      const data = await apiFetch<{ conversationId: string; sessionId: string }>(
        '/conversation/new',
        {
          method: 'POST',
          body: JSON.stringify({ userId, profile: p.name }),
        },
      );
      if (data.conversationId && data.sessionId) {
        setProfile(p.name);
        router.push(`/chat?conversation=${data.conversationId}&session=${data.sessionId}`);
      }
    } catch (err) {
      console.error('[start conversation]', err);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {enableNav && (
        <button className={`${styles.arrow} ${styles.left}`} onClick={prev} aria-label="Előző">
          <ChevronLeft />
        </button>
      )}
      <div className={styles.viewport}>
        <div
          className={`${styles.track} ${dragging ? styles.dragging : ''}`}
          ref={trackRef}
          style={{ transform }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {items.map((p, idx) => (
            <div key={idx} className={styles.card}>
              <ProfileCard {...p} onSelect={() => handleSelect(p)} />
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