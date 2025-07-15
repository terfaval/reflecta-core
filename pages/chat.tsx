import React from "react";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import UserErrorDisplay from "../components/UserErrorDisplay";
import ReflectiveMemoryPanel from "../components/ReflectiveMemoryPanel";
import ProfileSelectorSidebar, { Profile } from "../components/ProfileSelectorSidebar";
import ProfileSlider from "@/components/ProfileSlider";
import MobileProfileDropdown from "@/components/MobileProfileDropdown";
import LoadingPage from "./loading";
import { useUserSession } from "../hooks/useUserSession";
import { useAutoTextareaResize } from "../hooks/useAutoTextareaResize";
import { ChatFooter } from "../components/ChatFooter";
import { ChatMessagesList } from "../components/ChatMessagesList";
import { useScrollHandler } from "../hooks/useScrollHandler";
import { useHandleSend } from "../hooks/useHandleSend";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { useLastEntryContext, LastEntry } from "@/contexts/LastEntryContext";
import { v4 as uuidv4 } from 'uuid';
import { useAvailableProfiles } from '@/hooks/useAvailableProfiles';
import { useMemoryContext, MemoryMap, MemorySummary } from '@/contexts/MemoryContext';
import ProfileSwitchSuggestion from "@/components/ProfileSwitchSuggestion";

import { apiFetch, validateSession } from "@/lib/api";
import { redirectToChat } from "@/lib/navigation";
import { useErrorToast } from "@/hooks/useErrorToast";

interface Entry {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}


export default function ChatPage() {
  const { profile, setProfile } = useProfileContext();
  const router = useRouter();
  const debug = "debug" in (router.query || {});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [closingTrigger, setClosingTrigger] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pendingProfileSuggestion, setPendingProfileSuggestion] = useState<string | null>(null);
  const { userId, setUserId, userInitialized, userError, userRole, guestSessionId, setGuestSessionId } = useUserContext();
  const { sessionMap, setSessionMap } = useSessionContext();
  const { profiles: availableProfiles } = useAvailableProfiles();
  const { memoryMap, setMemoryMap } = useMemoryContext();
  const { lastEntryMap, setLastEntryMap } = useLastEntryContext();
  const errorToast = useErrorToast();
  const [sessionsReady, setSessionsReady] = useState(false);
  const [entriesReady, setEntriesReady] = useState(false);
  const [lastEntriesReady, setLastEntriesReady] = useState(false);
  const [memoryReady, setMemoryReady] = useState(userRole === 'guest');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  useEffect(() => {
    if (!router.isReady) return;
    if (userRole === 'guest') {
      router.replace('/guest-chat');
    }
  }, [router, userRole]);

  useEffect(() => {
    if (!userId || userRole === 'guest') return;
    if (Object.keys(sessionMap || {}).length) {
      setSessionsReady(true);
      return;
    }
    const loadMap = async () => {
      try {
        const all = await apiFetch<{
          conversation_id: string;
          profile: string;
          title: string | null;
          started_at: string;
          sessions: { id: string; started_at: string; ended_at: string | null }[];
        }[]>(`/api/conversations/list?userId=${encodeURIComponent(userId)}`);
        const map: Record<string, any[]> = {};
        all.forEach((conv) => {
          const arr = map[conv.profile] || [];
          arr.push({ ...conv, updatedAt: Date.now() });
          map[conv.profile] = arr;
        });
        setSessionMap(map);
        setSessionsReady(true);
      } catch (err) {
        console.error('[conversations/list]', err);
        setLoadingError('Nem sikerült betölteni a beszélgetéseket.');
      }
    };
    loadMap();
  }, [userId, userRole, sessionMap, setSessionMap]);

  useEffect(() => {
    if (!availableProfiles.length) return;
    if (userRole === 'guest') {
      setMemoryReady(true);
      return;
    }

    const missing = availableProfiles.filter((p) => !memoryMap[p.name]);
    if (missing.length === 0) {
      setMemoryReady(true);
      return;
    }

    const load = async () => {
      const updates: MemoryMap = {};
      await Promise.all(
        missing.map(async (p) => {
          const sid = sessionMap[p.name]?.[0]?.sessions?.[0]?.id;
          if (!sid) {
            updates[p.name] = [];
            return;
          }
          try {
            const data = await apiFetch<{ labels?: MemorySummary[] }>(
              `/api/memory/summary?sessionId=${encodeURIComponent(sid)}`
            );
            updates[p.name] = Array.isArray(data?.labels) ? data.labels : [];
          } catch (err) {
            console.error('[memory preload]', err);
            setLoadingError('Nem sikerült betölteni a memóriát.');
          }
        })
      );
      if (Object.keys(updates).length) {
        setMemoryMap((prev) => ({ ...prev, ...updates }));
      }
      const stillMissing = availableProfiles.filter((p) => !memoryMap[p.name] && !updates[p.name]);
      if (stillMissing.length === 0) setMemoryReady(true);
    };
    load();
  }, [availableProfiles, memoryMap, sessionMap, userRole]);

  useEffect(() => {
    if (!Object.keys(sessionMap || {}).length) return;
    if (userRole === 'guest') {
      setLastEntriesReady(true);
      return;
    }
    const missing = Object.keys(sessionMap).filter((p) => !lastEntryMap[p]);
    if (missing.length === 0) {
      setLastEntriesReady(true);
      return;
    }
    const load = async () => {
      const updates: Record<string, LastEntry> = {};
      await Promise.all(
        missing.map(async (p) => {
          const sid = sessionMap[p]?.[0]?.sessions?.[0]?.id;
          if (!sid) {
            updates[p] = { content: null, created_at: null, status: 'no-entry' };
            return;
          }
          try {
            const data = await apiFetch<LastEntry>(
              `/api/last-entry?sessionId=${encodeURIComponent(sid)}`,
            );
            if (data) updates[p] = data;
          } catch (err) {
            console.error('[last-entry preload]', err);
            setLoadingError('Nem sikerült betölteni a legutóbbi bejegyzéseket.');
          }
        }),
      );
      if (Object.keys(updates).length) {
        setLastEntryMap((prev) => ({ ...prev, ...updates }));
      }
      const stillMissing = Object.keys(sessionMap).filter(
        (p) => !lastEntryMap[p] && !updates[p],
      );
      if (stillMissing.length === 0) setLastEntriesReady(true);
    };
    load();
  }, [sessionMap, lastEntryMap, userRole]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [startingPrompt, setStartingPrompt] = useState<string>('');
  const [sessionIsFresh, setSessionIsFresh] = useState(false);
  const [page, setPage] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const limit = 20;
  const conversationCount: number | undefined = undefined;
  const isFetchingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const FALLBACK_STYLE: Record<string, string> = {
    '--bg-color': '#ffffff',
    '--user-color': '#7D9EDF',
    '--ai-color': '#C5DAF1',
  };
  const getStoredColors = () => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem('reflecta_colors');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return null;
    }
  };

  const [currentStyle, setCurrentStyle] = useState<Record<string, string>>(
    getStoredColors() || FALLBACK_STYLE,
  );
  const entriesByProfile = useMemo(
    () => (profile ? { [profile]: entries } : {}),
    [profile, entries]
  );
  const [showProfileSelect, setShowProfileSelect] = useState(false);

  // waiting for user initialization is handled in UserProvider

  useEffect(() => {
    if (debug) console.log("[Debug] profile", profile);
  }, [debug, profile]);

  useEffect(() => {
    if (userRole !== 'guest' || !profile) return;
    let sid =
      guestSessionId ||
      sessionStorage.getItem(`reflecta_session_${profile}`) ||
      sessionStorage.getItem('reflecta_guest_session_id');
    if (!sid) {
      sid = `guest-session-${uuidv4()}`;
    }
    sessionStorage.setItem(`reflecta_session_${profile}`, sid);
    sessionStorage.setItem('reflecta_guest_session_id', sid);
    setGuestSessionId(sid);
    if (!sessionId) {
      setSessionId(sid);
      setSessionIsFresh(true);
    }
  const verify = async () => {
      try {
        await apiFetch('/api/guest-session', {
          method: 'POST',
          body: JSON.stringify({ guestId: sid }),
        });
      } catch (err) {
        console.error('[guest-session]', err);
        errorToast({ message: 'Nem sikerült elindítani a vendég munkamenetet.', type: 'network' });
      }
    };
    verify();
  }, [userRole, profile]);

  const colorFetchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile || !userId || userRole === 'guest') return;
    if (colorFetchTimeout.current) clearTimeout(colorFetchTimeout.current);

    colorFetchTimeout.current = setTimeout(() => {
      const loadColors = async () => {
        try {
          const data = await apiFetch<{
            bg_color: string;
            user_color: string;
            ai_color: string;
          }>('/api/profile', {
            method: 'POST',
            body: JSON.stringify({ name: profile, userId }),
          });
          const style = {
            '--bg-color': data.bg_color,
            '--user-color': data.user_color,
            '--ai-color': data.ai_color,
          } as Record<string, string>;
          setCurrentStyle(style);
          sessionStorage.setItem('reflecta_colors', JSON.stringify(style));
        } catch (err) {
          console.error('[profile colors]', err);
          const stored = getStoredColors();
          setCurrentStyle(stored || FALLBACK_STYLE);
          errorToast({ message: 'Nem sikerült betölteni a profil megjelenését.', type: 'network' });
        }
      };
      loadColors();
    }, 300);

    return () => {
      if (colorFetchTimeout.current) {
        clearTimeout(colorFetchTimeout.current);
        colorFetchTimeout.current = null;
      }
    };
  }, [profile, userId, userRole]);
  
  useEffect(() => {
    if (debug) console.log("[Debug] userId", userId);
  }, [debug, userId]);

  useEffect(() => {
    if (!userId || profile || userRole === 'guest') return;
    const mapProfiles = Object.keys(sessionMap || {});
    if (mapProfiles.length) {
      const p = mapProfiles[0];
      const conv = sessionMap[p]?.[0];
      if (p) setProfile(p);
      if (conv?.sessions?.length) setSessionId(conv.sessions[0].id);
      return;
    }
    const load = async () => {
      try {
        const data = await apiFetch<{
          profile?: string;
          sessionId?: string;
          endedAt?: string | null;
        }>(
          `/api/last-session?userId=${encodeURIComponent(userId)}`,
          { method: "GET" }
        );
        if (data.profile) {
          setProfile(data.profile);
          if (data.sessionId && !data.endedAt) {
            setSessionId(data.sessionId);
          }
          return;
        }
      } catch (err) {
        console.error("[last-session]", err);
        errorToast({ message: 'Nem sikerült betölteni az előző munkamenetet.', type: 'network' });
      }
      setShowProfileSelect(true);
    };
    load();
  }, [userId, profile, setProfile, sessionMap, userRole]);
  
  useEffect(() => {
    if (debug) console.log("[Debug] sessionId", sessionId);
  }, [debug, sessionId]);

  useEffect(() => {
    if (debug) console.log("[Debug] entries", entries.length);
  }, [debug, entries]);

  const handleReady = useCallback(
    ({ userId, sessionId, startingPrompt, closingTrigger, entries: initEntries }) => {
      if (debug) {
        console.log("[Debug] session ready", { userId, sessionId });
      }

      setUserId(userId);
      setSessionId(sessionId);
      setStartingPrompt(startingPrompt);
      setClosingTrigger(closingTrigger);
      setSessionIsFresh(true);
      if (initEntries && initEntries.length) {
        setEntries(initEntries);
      }
      setEntriesReady(true);
    },
    [
      setUserId,
      setSessionId,
      setStartingPrompt,
      setClosingTrigger,
      setSessionIsFresh,
    ],
  );

  useUserSession({
    profile,
    onReady: handleReady,
    enabled: !!userId && !!profile && !sessionId && userRole !== 'guest',
    userId,
    userRole,
  });

  useAutoTextareaResize();

  useScrollHandler({
    ref: messagesRef,
    loading,
    onNearTop: () => {
      setPage((prev) => {
        const nextPage = prev + 1;
        fetchMoreEntries(nextPage);
        return nextPage;
      });
    },
    onScrollBottomStateChange: setShowScrollDown,
  });

  const handleSend = useHandleSend({
    sessionId,
    userId,
    profile,
    closingTrigger,
    setMessage,
    setEntries,
    setLoading,
    setSessionIsFresh,
    setIsClosing,
    setSessionId,
    userRole,
    entries,
    onRecommendedProfile: userRole === 'admin' ? setPendingProfileSuggestion : undefined,
  });

  useEffect(() => {
    if (debug) console.log("[Debug] ChatPage render");
  });

  useEffect(() => {
    if (debug) console.log("[Debug] loadingEntries", loadingEntries);
  }, [debug, loadingEntries]);

  useEffect(() => {
    if (sessionId && !loadingEntries) {
      setEntriesReady(true);
    }
  }, [sessionId, loadingEntries]);

  const assistantReplyCount = useMemo(() => {
    return entries.filter(
      (e) => e.role === "assistant" && e.content !== "__thinking__",
    ).length;
  }, [entries]);

  const handleSidebarSelect = async (p: Profile) => {
    const name = p.id;
    if (!userId || !name || userRole === 'guest') {
      // eslint-disable-next-line no-console
      console.warn('[switch profile] missing userId or profile');
      return;
    }
    // eslint-disable-next-line no-console
    console.log('[switch profile]', { userId, profile_name: name });
    
    const convs = sessionMap[name];
    if (convs && convs[0]?.sessions?.length) {
      const conversationId = convs[0].conversation_id;
      const storedSessionId = convs[0].sessions[0].id;
      
      let valid = false;
      const stale =
        !convs[0].updatedAt || Date.now() - convs[0].updatedAt > 5 * 60 * 1000;
      if (!stale) {
        valid = true;
      } else {
        valid = await validateSession(storedSessionId, conversationId);
      }

      if (valid) {
        setSessionMap((prev) => {
          const arr = prev[name] ? [...prev[name]] : [];
          if (arr[0]) arr[0].updatedAt = Date.now();
          return { ...prev, [name]: arr };
        });

        sessionStorage.setItem(`reflecta_session_${name}`, storedSessionId);
        setProfile(name);
        setSessionId(storedSessionId);
        const style = {
          '--bg-color': p.bg_color,
          '--user-color': p.user_color,
          '--ai-color': p.ai_color,
        } as Record<string, string>;
        sessionStorage.setItem('reflecta_colors', JSON.stringify(style));
        setCurrentStyle(style);
        redirectToChat(router, conversationId, storedSessionId, true);
        setEntries([]);
        setStartingPrompt('');
        setSessionIsFresh(true);
        return;
      }

      // invalid or failed validation -> remove corrupted entry and fall through
      setSessionMap((prev) => {
        const arr = (prev[name] || []).filter(
          (c) => c.conversation_id !== conversationId,
        );
        return { ...prev, [name]: arr };
      });
    }
    
    try {
      const params = new URLSearchParams({ profile: name });
      const data = await apiFetch<{
        conversation_id: string | null;
        session_id: string | null;
      }>(`/api/conversation/by-profile?${params.toString()}`);
      if (data.conversation_id && data.session_id) {
        sessionStorage.setItem(`reflecta_session_${name}`, data.session_id);
        setProfile(name);
        setSessionId(data.session_id);
        setSessionMap((prev) => {
          const arr = prev[name] ? [...prev[name]] : [];
          arr.unshift({
            conversation_id: data.conversation_id,
            profile: name,
            sessions: [
              { id: data.session_id, started_at: '', ended_at: null },
            ],
            updatedAt: Date.now(),
          });
          return { ...prev, [name]: arr };
        });
        const style = {
          '--bg-color': p.bg_color,
          '--user-color': p.user_color,
          '--ai-color': p.ai_color,
        } as Record<string, string>;
        sessionStorage.setItem('reflecta_colors', JSON.stringify(style));
        setCurrentStyle(style);
        redirectToChat(router, data.conversation_id, data.session_id, true);
        setEntries([]);
        setStartingPrompt('');
        setSessionIsFresh(true);
        return;
      }
    } catch (err) {
      console.error('[conversation/by-profile]', err);
    }
    try {
      const data = await apiFetch<{
        status: string; conversation_id: string; session_id: string
      }>(
        '/api/conversation/new',
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, profile_name: name }),
        },
      );
      if (data.conversation_id && data.session_id) {
        sessionStorage.setItem(`reflecta_session_${name}`, data.session_id);

        setProfile(name);
        setSessionId(data.session_id);
        setSessionMap((prev) => {
          const arr = prev[name] ? [...prev[name]] : [];
          arr.unshift({
            conversation_id: data.conversation_id,
            profile: name,
            sessions: [
              { id: data.session_id, started_at: '', ended_at: null },
            ],
            updatedAt: Date.now(),
          });
          return { ...prev, [name]: arr };
        });
        const style = {
          '--bg-color': p.bg_color,
          '--user-color': p.user_color,
          '--ai-color': p.ai_color,
        } as Record<string, string>;
        sessionStorage.setItem('reflecta_colors', JSON.stringify(style));
        setCurrentStyle(style);
        redirectToChat(
          router,
          data.conversation_id,
          data.session_id,
          data.status === 'existing'
        );
        // Reset previous entries and prompts for the new session context
        setEntries([]);
        setStartingPrompt('');
        setSessionIsFresh(true);
      }
    } catch (err) {
      console.error('[switch profile]', err);
      errorToast({ message: 'Nem sikerült váltani a profilok között.', type: 'network' });
    }
  };

  const handleAcceptProfileSuggestion = async () => {
    if (!pendingProfileSuggestion || !sessionId || userRole !== 'admin') {
      setPendingProfileSuggestion(null);
      return;
    }
    try {
      const data = await apiFetch<{
        newProfile: string;
        newSessionId: string;
        conversationId: string;
      }>('/api/session/switch-profile', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          newProfile: pendingProfileSuggestion,
        }),
      });
      setProfile(data.newProfile);
      setSessionId(data.newSessionId);
      redirectToChat(router, data.conversationId, data.newSessionId, false);
      setPendingProfileSuggestion(null);
    } catch (err) {
      console.error('[switch-profile]', err);
      errorToast({ message: 'Nem sikerült átváltani a profilra.', type: 'network' });
      setPendingProfileSuggestion(null);
    }
  };

  const handleDeclineProfileSuggestion = () => {
    setPendingProfileSuggestion(null);
  };

  const handleCreateCustomProfile = () => {
    if (userRole === 'guest') return;
    router.push("/profile-builder");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchMoreEntries = async (pageIndex: number) => {
    if (!userId || !profile || isFetchingRef.current || userRole === 'guest') return;

    if (debug) console.log("[Debug] fetching page", pageIndex);

    isFetchingRef.current = true;
    setEntriesError(null);
    setLoadingEntries(true);
    const timeout = setTimeout(() => {
      if (isFetchingRef.current) {
        setEntriesError('A betöltés túl sokáig tart. Próbáld újra.');
        setLoadingEntries(false);
        isFetchingRef.current = false;
      }
    }, 15000);
    try {
      const data = await apiFetch<{
        entries?: Entry[];
        closingTrigger?: string;
      }>("/api/chatload", {
        method: "POST",
        body: JSON.stringify({
          userId,
          profile,
          offset: pageIndex * limit,
          limit,
          conversationCount,
        }),
      });

      if (debug) console.log("[Debug] fetchMoreEntries result", data);

      if (data?.entries?.length) {
        setSessionIsFresh(false);
        setClosingTrigger(data.closingTrigger);
        setEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newOnes = data.entries.filter((e) => !existingIds.has(e.id));
          return [...newOnes, ...prev];
        });
      }
      setEntriesError(null);
      setLoadingEntries(false);
    } catch (err) {
      console.error("[chatload] fetch error:", err);
      setEntriesError('Hiba történt az üzenetek betöltésekor.');
      if (pageIndex === 0 && entries.length === 0) {
        setLoadingError('Hiba történt az üzenetek betöltésekor.');
      }
      errorToast({ message: 'Hiba történt az üzenetek betöltésekor.', type: 'network', retry: () => fetchMoreEntries(pageIndex) });
      setLoadingEntries(false);
    } finally {
      clearTimeout(timeout);
      isFetchingRef.current = false;

      if (debug) console.log("[Debug] fetch complete");
      setEntriesReady(true);
    }
  };

  useEffect(() => {
    if (debug) console.log("[Debug] fetchMoreEntries called. Page:", page);
  }, [debug, page]);

  useEffect(() => {
    if (!profile || sessionId || userRole === 'guest') return;
    const convs = sessionMap[profile];
    if (convs && convs[0]?.sessions?.length) {
      setSessionId(convs[0].sessions[0].id);
    }
  }, [profile, sessionId, sessionMap, userRole]);
  
  useEffect(() => {
    if (!profile || typeof profile !== "string" || !userId || !sessionId || userRole === 'guest')
      return;
    setPage(0);
    setEntries([]);
    fetchMoreEntries(0);
  }, [profile, userId, sessionId, userRole]);

  useEffect(() => {
    if (
      !sessionIsFresh ||
      startingPrompt ||
      !userId ||
      !profile ||
      entries.length !== 0 ||
      userRole === 'guest'
    )
      return;
    const loadPrompt = async () => {
      try {
        const data = await apiFetch<{ prompt: string }>("/api/starting-prompt", {
          method: "POST",
          body: JSON.stringify({ userId, profile }),
        });
        setStartingPrompt(data.prompt);
      } catch (err) {
        console.error("[starting-prompt]", err);
        errorToast({ message: 'Nem sikerült betölteni az indító üzenetet.', type: 'network' });
      }
    };
    loadPrompt();
  }, [sessionIsFresh, startingPrompt, userId, profile, entries.length, userRole]);


  if (userError) {
    return (
      <UserErrorDisplay
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loadingError) {
    return (
      <UserErrorDisplay
        message={loadingError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const ready = sessionsReady && lastEntriesReady && memoryReady && entriesReady;
  if (!ready) {
    return <LoadingPage />;
  }

  if (showProfileSelect || (userInitialized && !profile && !sessionId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProfileSlider />
      </div>
    );
  }

  return (
    <div className="reflecta-chat chat-layout" style={currentStyle}>
      {pendingProfileSuggestion && userRole === 'admin' && (
        <ProfileSwitchSuggestion
          profileName={pendingProfileSuggestion}
          onAccept={handleAcceptProfileSuggestion}
          onDecline={handleDeclineProfileSuggestion}
        />
      )}
      <div className="chat-profile-sidebar">
        {userRole !== 'guest' && (
          <ProfileSelectorSidebar
            entries={entriesByProfile}
            onProfileSelect={handleSidebarSelect}
            onCreateCustomProfile={handleCreateCustomProfile}
          />
        )}
      </div>
      <div className="chat-area">
        <MobileProfileDropdown onProfileSelect={handleSidebarSelect} />
        <ChatMessagesList
          entries={entries}
          loadingEntries={loadingEntries}
          loadError={entriesError}
          onRetryLoad={() => fetchMoreEntries(page)}
          sessionIsFresh={sessionIsFresh}
          startingPrompt={startingPrompt}
          onSelectPrompt={handleSend}
          onTweak={handleSend}
          currentStyle={currentStyle}
          sessionId={sessionId}
          bottomRef={bottomRef}
          showScrollDown={showScrollDown}
          messagesRef={messagesRef}
        />
        <ChatFooter
          message={message}
          setMessage={setMessage}
          loading={loading}
          handleSend={handleSend}
          closingTrigger={closingTrigger}
          sessionId={sessionId}
          setSessionId={setSessionId}
          isClosing={isClosing}
          assistantReplyCount={assistantReplyCount}
          setIsClosing={setIsClosing}
          setEntries={setEntries}
          currentStyle={currentStyle}
        />
      </div>
      <div className="chat-memory-panel">
        {userRole !== 'guest' && (
           <ReflectiveMemoryPanel
            sessionId={sessionId}
            handleSend={handleSend}
            userColor={currentStyle['--user-color']}
          />
        )}
      </div>
    </div>
  );
}
