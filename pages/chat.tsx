import React from "react"; 

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import UserErrorDisplay from "../components/UserErrorDisplay";
import ReflectiveMemoryPanel from "../components/ReflectiveMemoryPanel";
import ProfileSelectorSidebar, { Profile } from "../components/ProfileSelectorSidebar";
import ProfileSlider from "@/components/ProfileSlider";
import MobileProfileDropdown from "@/components/MobileProfileDropdown";
import { useUserSession } from "../hooks/useUserSession";
import { useAutoTextareaResize } from "../hooks/useAutoTextareaResize";
import { ChatFooter } from "../components/ChatFooter";
import { ChatMessagesList } from "../components/ChatMessagesList";
import { useScrollHandler } from "../hooks/useScrollHandler";
import { useHandleSend } from "../hooks/useHandleSend";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileContext } from "@/contexts/ProfileContext";
import { v4 as uuidv4 } from 'uuid';

import { apiFetch } from "@/lib/api";
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
  const { userId, setUserId, userInitialized, userError, userRole, guestSessionId, setGuestSessionId } = useUserContext();
  const errorToast = useErrorToast();
  useEffect(() => {
    if (!router.isReady) return;
    if (userRole === 'guest') {
      router.replace('/guest-chat');
    }
  }, [router, userRole]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [startingPrompt, setStartingPrompt] = useState<string>('');
  const [sessionIsFresh, setSessionIsFresh] = useState(false);
  const [page, setPage] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const limit = 20;
  const isFetchingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const DEFAULT_STYLE: Record<string, string> = {
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

  const [currentStyle, setCurrentStyle] = useState<Record<string, string>>(getStoredColors() || DEFAULT_STYLE);

  useEffect(() => {
    sessionStorage.removeItem('reflecta_colors');
  }, []);
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

  useEffect(() => {
    if (!profile || !userId || userRole === 'guest') return;
    const loadColors = async () => {
      try {
        const data = await apiFetch<{
          bg_color: string;
          user_color: string;
          ai_color: string;
        }>(
          '/api/profile',
          {
            method: 'POST',
            body: JSON.stringify({ name: profile, userId }),
          },
        );
        setCurrentStyle({
          '--bg-color': data.bg_color,
          '--user-color': data.user_color,
          '--ai-color': data.ai_color,
        });
      } catch (err) {
        console.error('[profile colors]', err);
        errorToast({ message: 'Nem sikerült betölteni a színbeállításokat.', type: 'network' });
      }
    };
    loadColors();
  }, [profile, userId, userRole]);
  
  useEffect(() => {
    if (debug) console.log("[Debug] userId", userId);
  }, [debug, userId]);

  useEffect(() => {
    if (!userId || profile || userRole === 'guest') return;
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
  }, [userId, profile, setProfile]);

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
  });

  useEffect(() => {
    if (debug) console.log("[Debug] ChatPage render");
  });

  useEffect(() => {
    if (debug) console.log("[Debug] loadingEntries", loadingEntries);
  }, [debug, loadingEntries]);

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
    try {
      const data = await apiFetch<{
        status: string; conversation_id: string; session_id: string 
}>(
        "/api/conversation/new",
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId, profile_name: name }),
        },
      );
      if (data.conversation_id && data.session_id) {
        // Store the new session id so useUserSession can resume without
        // attempting to create another session.
        sessionStorage.setItem(`reflecta_session_${name}`, data.session_id);

        setProfile(name);
        setSessionId(data.session_id);
        sessionStorage.setItem(
          'reflecta_colors',
          JSON.stringify({
            '--bg-color': p.bg_color,
            '--user-color': p.user_color,
            '--ai-color': p.ai_color,
          }),
        );
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
      console.error("[switch profile]", err);
      errorToast({ message: 'Nem sikerült váltani a profilok között.', type: 'network' });
    }
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
      errorToast({ message: 'Hiba történt az üzenetek betöltésekor.', type: 'network', retry: () => fetchMoreEntries(pageIndex) });
      setLoadingEntries(false);
    } finally {
      clearTimeout(timeout);
      isFetchingRef.current = false;

      if (debug) console.log("[Debug] fetch complete");
    }
  };

  useEffect(() => {
    if (debug) console.log("[Debug] fetchMoreEntries called. Page:", page);
  }, [debug, page]);

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

  if (showProfileSelect || (userInitialized && !profile && !sessionId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProfileSlider />
      </div>
    );
  }

  return (
    <div className="reflecta-chat chat-layout" style={currentStyle}>
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
          <ReflectiveMemoryPanel sessionId={sessionId} handleSend={handleSend} />
        )}
      </div>
    </div>
  );
}
