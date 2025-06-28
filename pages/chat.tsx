import React from "react"; 

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { profileStyles } from "../styles/profileStyles";
import UserErrorDisplay from "../components/UserErrorDisplay";
import SpiralLoader from "../components/SpiralLoader";
import ReflectiveMemoryPanel from "../components/ReflectiveMemoryPanel";
import ProfileSelectorSidebar, {
  Profile as SidebarProfile,
} from "../components/ProfileSelectorSidebar";
import ProfileSlider from "@/components/ProfileSlider";
import { useUserSession } from "../hooks/useUserSession";
import { useAutoTextareaResize } from "../hooks/useAutoTextareaResize";
import { ChatFooter } from "../components/ChatFooter";
import { ChatMessagesList } from "../components/ChatMessagesList";
import { useScrollHandler } from "../hooks/useScrollHandler";
import { useHandleSend } from "../hooks/useHandleSend";
import { useUserContext } from "@/contexts/UserContext";
import { useProfileContext } from "@/contexts/ProfileContext";

import { apiFetch } from "@/lib/api";

interface Entry {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

const SIDEBAR_ORDER = [
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

const NAME_TO_ICON: Record<string, string | undefined> = {
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

export default function ChatPage() {
  const { profile, setProfile } = useProfileContext();
  const router = useRouter();
  const debug = "debug" in (router.query || {});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [closingTrigger, setClosingTrigger] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { userId, setUserId, userInitialized, userError } = useUserContext();
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
  const [sidebarRole, setSidebarRole] = useState<'basic' | 'premium'>('basic');
  const [customProfileData, setCustomProfileData] = useState<SidebarProfile | null>(null);
  const [sidebarProfiles, setSidebarProfiles] = useState<SidebarProfile[]>([]);
  const currentStyle =
    profileStyles[profile as string] ||
    profileStyles[(profile as string)?.toLowerCase()] ||
    {};
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
    if (debug) console.log("[Debug] userId", userId);
  }, [debug, userId]);

  useEffect(() => {
    if (!userId || profile) return;
    const load = async () => {
      try {
        const data = await apiFetch<{ profile?: string; sessionId?: string }>(
          `/api/last-session?userId=${encodeURIComponent(userId)}`,
          { method: "GET" }
        );
        if (data.profile && data.sessionId) {
          setProfile(data.profile);
          setSessionId(data.sessionId);
          return;
        }
      } catch (err) {
        console.error("[last-session]", err);
      }
      setShowProfileSelect(true);
    };
    load();
  }, [userId, profile, setProfile]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await apiFetch<{
          profiles?: any[];
          personalProfiles?: string[];
          role?: string;
          error?: string;
        }>("/api/profile-list", {
          method: "POST",
          body: JSON.stringify({ userId, names: SIDEBAR_ORDER }),
        });
        if (data.profiles) {
          const map: Record<string, SidebarProfile> = {};
          (data.profiles || []).forEach((p: any) => {
            map[p.name] = {
              id: p.name,
              name: p.name,
              role: p.role,
              color: p.color,
              iconName: NAME_TO_ICON[p.name],
            };
          });
          const personal = (data.personalProfiles || [])[0];
          setCustomProfileData(personal ? map[personal] || null : null);
          const others: SidebarProfile[] = [];
          SIDEBAR_ORDER.slice(1).forEach((n) => {
            if (map[n]) others.push(map[n]);
          });
          setSidebarProfiles(others);
          setSidebarRole(data.role === "premium" ? "premium" : "basic");
        } else if (data.error) {
          console.error("[profile-list]", data.error);
        }
      } catch (err) {
        console.error("[profile-list fetch]", err);
      }
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (debug) console.log("[Debug] sessionId", sessionId);
  }, [debug, sessionId]);

  useEffect(() => {
    if (debug) console.log("[Debug] entries", entries.length);
  }, [debug, entries]);

  const handleReady = useCallback(
    ({ userId, sessionId, startingPrompt, closingTrigger }) => {
      if (debug) {
        console.log("[Debug] session ready", { userId, sessionId });
      }

      setUserId(userId);
      setSessionId(sessionId);
      setStartingPrompt(startingPrompt);
      setClosingTrigger(closingTrigger);
      setSessionIsFresh(true);
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
    enabled: !!userId && !!profile && !sessionId,
    userId,
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

  const handleSidebarSelect = async (name: string) => {
    if (!userId || !name) {
      // eslint-disable-next-line no-console
      console.warn('[switch profile] missing userId or profile');
      return;
    }
    // eslint-disable-next-line no-console
    console.log('[switch profile]', { userId, profile: name });
    try {
      const data = await apiFetch<{ conversation_id: string; session_id: string }>(
        "/api/conversation/new",
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId, profile_name: name }),
        },
      );
      if (data.conversation_id && data.session_id) {
        setProfile(name);
        router.push(`/chat?conversation=${data.conversation_id}&session=${data.session_id}`);
      }
    } catch (err) {
      console.error("[switch profile]", err);
    }
  };

  const handleCreateCustomProfile = () => {
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
    if (!userId || !profile || isFetchingRef.current) return;

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
    if (!profile || typeof profile !== "string" || !userId || !sessionId)
      return;
    setPage(0);
    setEntries([]);
    fetchMoreEntries(0);
  }, [profile, userId, sessionId]);

  if (userError) {
    return (
      <UserErrorDisplay
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!userInitialized) {
    return (
      <SpiralLoader
        userColor={currentStyle["--user-color"] || "#7A4DFF"}
        aiColor={currentStyle["--ai-color"] || "#FFB347"}
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

  if (!sessionId) {
    return (
      <SpiralLoader
        userColor={currentStyle["--user-color"] || "#7A4DFF"}
        aiColor={currentStyle["--ai-color"] || "#FFB347"}
      />
    );
  }

  return (
    <div className="reflecta-chat chat-layout" style={currentStyle}>
      <div className="chat-profile-sidebar">
        <ProfileSelectorSidebar
          userRole={sidebarRole}
          customProfile={customProfileData}
          lastUsedProfiles={sidebarProfiles}
          unusedProfiles={[]}
          entries={entriesByProfile}
          onProfileSelect={handleSidebarSelect}
          onCreateCustomProfile={handleCreateCustomProfile}
        />
      </div>
      <div className="chat-area">
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
        <ReflectiveMemoryPanel sessionId={sessionId} handleSend={handleSend} />
      </div>
    </div>
  );
}
