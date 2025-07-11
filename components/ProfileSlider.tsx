import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import ProfileCard, { ProfileCardProps } from "./ProfileCard";
import styles from "./ProfileSlider.module.css";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { apiFetch } from "@/lib/api";
import { redirectToChat } from "@/lib/navigation";
import { toast } from "react-toastify";

export interface ProfileCardData
  extends Omit<ProfileCardProps, "onSelect"> {
  personal?: boolean;
}

const BASE_ORDER = [
  "Reflecta",
  "Akasza",
  "Éana",
  "Luma",
  "Sylva",
  "Zentó",
  "Oneiros",
  "Kairos",
  "Noe",
];

const ICON_MAP: Record<string, string | undefined> = {
  Reflecta: "ReflectaIcon",
  Akasza: "AkaszaIcon",
  "Éana": "EanaIcon",
  Luma: "LumaIcon",
  Sylva: "SylvaIcon",
  "Zentó": "ZentoIcon",
  Oneiros: "OneirosIcon",
  Kairos: "KairosIcon",
  Noe: "NoeIcon",
  Solun: "SolunIcon",
  Preceptor: "PreceptorIcon",
};

const DEFAULT_BG_COLOR = "#ffffff";
const DEFAULT_USER_COLOR = "#7D9EDF";

// Fallback colors for guest users when profile data is not loaded
const DEFAULT_PROFILE_COLORS: Record<
  string,
  { bg: string; user: string }
> = {
  Reflecta: { bg: "#ffffff", user: "#7D9EDF" },
  Akasza: { bg: "#F5E8D3", user: "#E1A97F" },
  "Éana": { bg: "#F0F9FF", user: "#5DAE8B" },
  Luma: { bg: "#FFF5D6", user: "#F7B500" },
  Sylva: { bg: "#E9F5F1", user: "#3CB371" },
  "Zentó": { bg: "#F5F0E5", user: "#A26EBA" },
  Oneiros: { bg: "#F4EEFF", user: "#8B5CF6" },
  Kairos: { bg: "#E8F6F6", user: "#00ACC1" },
  Noe: { bg: "#ECEFF1", user: "#455A64" },
};

const GUEST_PROFILES: ProfileCardData[] = BASE_ORDER.map((name) => {
  const colors = DEFAULT_PROFILE_COLORS[name] || {
    bg: DEFAULT_BG_COLOR,
    user: DEFAULT_USER_COLOR,
  };
  return {
    name,
    iconName: ICON_MAP[name],
    description: "",
    role: "",
    color: colors.bg,
    userColor: colors.user,
    bgColor: colors.bg,
  };
});


export default function ProfileSlider() {
  const { userId, userRole } = useUserContext();
  const { setProfile } = useProfileContext();
  const router = useRouter();

  const [profiles, setProfiles] = useState<ProfileCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPersonal, setHasPersonal] = useState(false);

  const visibleCount = 4;
  const gap = 16;
  const BUFFER_COPIES = 5; // number of times the profile list is repeated

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(1);

  // index points to the currently active real profile
  const [index, setIndex] = useState(0);
  
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const startTime = useRef(0);
  const [creating, setCreating] = useState(false);

  const loadProfiles = async () => {
    if (!userId || userRole === 'guest') return;
    setError(null);
    try {
      const names = BASE_ORDER;
      const meta = await apiFetch<{
        profiles: any[];
        personalProfiles?: string[];
        error?: string;
      }>("/api/profile-list", {
        method: "POST",
        body: JSON.stringify({ userId, names }),
      });
      if (meta.profiles) {
        const map: Record<string, any> = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = p;
          });
          const makeCard = (name: string, personal = false): ProfileCardData => {
            const rec = map[name] || {};
            return {
              name,
              iconName: ICON_MAP[name],
              description: rec.description || '',
              color: rec.bg_color,
              role: rec.role || '',
              userColor: rec.user_color,
              bgColor: rec.bg_color,
              personal,
            };
          };
          const personalNames = meta.personalProfiles || [];
          setHasPersonal(personalNames.length > 0);
          const cards: ProfileCardData[] = [];
          BASE_ORDER.forEach((n) => {
            if (n === "Reflecta") {
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
        else setIndex(cards.length * Math.floor(BUFFER_COPIES / 2));
      } else {
        console.error("[profile-list]", meta.error);
        setError("Nem sikerült betölteni a profilokat.");
      }
    } catch (err) {
      console.error("[profile-list fetch]", err);
      setError("Nem sikerült betölteni a profilokat.");
    }
  };

  useEffect(() => {
    if (userRole === 'guest') {
      setProfiles(GUEST_PROFILES);
      setHasPersonal(false);
      return;
    }
    if (!userId) return;
    loadProfiles();
  }, [userId, userRole]);

  const enableNav = profiles.length > visibleCount;

  const centerIndex = profiles.length * Math.floor(BUFFER_COPIES / 2);

  useEffect(() => {
    if (enableNav) {
      setIndex(centerIndex);
    } else {
      setIndex(0);
    }
  }, [profiles.length, itemWidth, enableNav, centerIndex]);

  const items = React.useMemo(() => {
    if (!profiles.length) return [] as ProfileCardData[];
    if (!enableNav) return profiles;
    const arr: ProfileCardData[] = [];
    for (let i = 0; i < BUFFER_COPIES; i += 1) {
      arr.push(...profiles);
    }
    return arr;
  }, [profiles, enableNav]);

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
  }, [profiles.length, itemWidth, enableNav]);

  // reposition into the middle of the buffer when reaching the ends
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handle = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "transform") return;
      if (!enableNav) return;
      if (dragging) return;
      const len = profiles.length;
      if (len === 0) return;
      const min = len;
      const max = len * (BUFFER_COPIES - 1);
      if (index < min || index >= max) {
        const pos = ((index % len) + len) % len + centerIndex;
        el.style.transition = "none";
        setIndex(pos);
        requestAnimationFrame(() => {
          el.style.transition = "";
        });
      }
    };
    el.addEventListener("transitionend", handle);
    return () => el.removeEventListener("transitionend", handle);
  }, [index, profiles.length, enableNav, dragging, centerIndex]);

  const prev = () => {
    if (!enableNav) return;
    setIndex((i) => i - 1);
  };
  const next = () => {
    if (!enableNav) return;
    setIndex((i) => i + 1);
  };

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
    if (steps === 0 && (Math.abs(delta) > threshold || velocity > 0.2))
      steps = 1;
    const maxSteps = enableNav ? visibleCount : profiles.length;
    if (steps > maxSteps) steps = maxSteps;
    setDragging(false);
    setDragX(0);
    if (steps) {
      if (delta < 0) {
        setIndex((i) => i + steps);
      } else if (delta > 0) {
        setIndex((i) => i - steps);
      }
    }
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

  const baseOffset = 0;
  const transform = `translateX(${dragX + baseOffset - index * (itemWidth + gap)}px)`;

  const handleSelect = async (p: ProfileCardData) => {
    if (creating) return;
    setCreating(true);
    if (userRole === 'guest') {
      console.warn('[select profile] guest user cannot start conversation');
      setCreating(false);
      return;
    }
    console.log('➡️ Profile selected:', p?.name);
    if (!userId || !p?.name) {
      console.warn('[start conversation] missing userId or profile', {
        userId,
        profile: p?.name,
      });
      toast.error('Hiányzó felhasználó vagy profil.');
      setError('Hiányzó felhasználó vagy profil.');
      return;
    }
    
    console.log('📤 Sending request to /api/conversation/new:', {
      user_id: userId,
      profile_name: p.name,
    });

    try {
      const data = await apiFetch<{
        status: string;
        conversation_id: string;
        session_id: string;
      }>("/api/conversation/new", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, profile_name: p.name }),
      });

      console.log('✅ Got response from backend:', data);

      if (data.conversation_id && data.session_id) {
        setProfile(p.name);
        console.log('🔁 Redirecting to chat');
        redirectToChat(
          router,
          data.conversation_id,
          data.session_id,
          data.status === 'existing'
        );
      } else {
        toast.error('Nem sikerült elindítani a beszélgetést.');
        setError('Nem sikerült elindítani a beszélgetést.');
      }
    } catch (err) {
      console.error('[start conversation]', err);
      toast.error('Nem sikerült elindítani a beszélgetést.');
      setError('Nem sikerült elindítani a beszélgetést.');
      } finally {
      setCreating(false);
    }
  };

  return (
    <>
    <div className={styles.container} ref={containerRef}>
      {enableNav && (
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={prev}
          disabled={creating}
          aria-label="Előző"
        >
          <ChevronLeft />
        </button>
      )}
      <div className={styles.viewport} style={{ pointerEvents: creating ? 'none' : 'auto' }}>
        <div
          className={`${styles.track} ${dragging ? styles.dragging : ""}`}
          ref={trackRef}
          style={{ transform }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {items.map((p, idx) => (
            <div
              key={idx}
              className={styles.card}
              style={{ pointerEvents: creating ? 'none' : 'auto', opacity: creating ? 0.6 : 1 }}
            >
              <ProfileCard {...p} onSelect={() => handleSelect(p)} />
            </div>
          ))}
        </div>
      </div>
      {enableNav && (
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={next}
          disabled={creating}
          aria-label="Következő"
        >
          <ChevronRight />
        </button>
      )}
    </div>
    {error && (
      <div className={styles.error}>
        <p>{error}</p>
        <button className={styles.retry} onClick={loadProfiles}>Újrapróbálom</button>
      </div>
    )}
    </>
  );
}