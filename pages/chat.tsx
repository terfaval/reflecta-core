import React from "react"; 

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { profileStyles, buttonStyles } from "../styles/profileStyles";
import UserErrorDisplay from "../components/UserErrorDisplay";
import SpiralLoader from "../components/SpiralLoader";
import ThinkingDots from "../components/ThinkingDots";
import ScrollToBottomButton from "../components/ScrollToBottomButton";
import StartingPromptSelector from "../components/StartingPromptSelector";
import SessionLabelBubble from "../components/SessionLabelBubble";
import ReflectiveMemoryPanel from "../components/ReflectiveMemoryPanel";
import ProfileSelectorSidebar from "../components/ProfileSelectorSidebar";
import ProfileCarousel, { ProfileCardData } from "@/components/ProfileSlider";
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

const DEFAULT_PROFILES: { name: string; iconName?: string }[] = [
  { name: "Reflecta", iconName: "ReflectaIcon" },
  { name: "Akasza", iconName: "AkaszaIcon" },
  { name: "Éana", iconName: "EanaIcon" },
  { name: "Luma", iconName: "LumaIcon" },
  { name: "Sylva", iconName: "SylvaIcon" },
  { name: "Zentó", iconName: "ZentoIcon" },
  { name: "Oneiros", iconName: "OneirosIcon" },
  { name: "Kairos", iconName: "KairosIcon" },
  { name: "Noe", iconName: "NoeIcon" },
];

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
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [startingPrompts, setStartingPrompts] = useState<
    { label: string; message: string }[]
  >([]);
  const [sessionIsFresh, setSessionIsFresh] = useState(false);
  const [page, setPage] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const limit = 20;
  const isFetchingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const currentStyle =
    profileStyles[profile as string] ||
    profileStyles[(profile as string)?.toLowerCase()] ||
    {};
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [profiles, setProfiles] = useState<ProfileCardData[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

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
      setLoadingProfiles(true);
      try {
        const data = await apiFetch<{ profile?: string; sessionId?: string }>(
          "/last-session",
          {
            method: "POST",
            body: JSON.stringify({ userId }),
          }
        );
        if (data.profile && data.sessionId) {
          setProfile(data.profile);
          setSessionId(data.sessionId);
          setLoadingProfiles(false);
          return;
        }
      } catch (err) {
        console.error("[last-session]", err);
      }
      try {
        const names = DEFAULT_PROFILES.map((p) => p.name);
        const meta = await apiFetch<{
          profiles: any[];
          personalProfiles?: string[];
          role?: string;
          error?: string;
        }>("/api/profile-list", {
          method: "POST",
          body: JSON.stringify({ userId, names }),
        });
        if (meta.profiles) {
          const map: Record<
            string,
            { description: string; color: string; role?: string }
          > = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = {
              description: p.description,
              color: p.color,
              role: p.role,
            };
          });
          const defaults = DEFAULT_PROFILES.map((p) => ({
            ...p,
            description: map[p.name]?.description || "",
            color: map[p.name]?.color || "#fff",
            role: map[p.name]?.role || "",
            userColor:
              (profileStyles[p.name] ||
                profileStyles[p.name.toLowerCase()] || {})["--user-color"] || "#000",
            bgColor:
              (profileStyles[p.name] ||
                profileStyles[p.name.toLowerCase()] || {})["--bg-color"] || "#fff",
          }));

          const personalProfiles: ProfileCardData[] = [];
          (meta.personalProfiles || []).forEach((name) => {
            const pm = map[name] || { description: "", color: "#fff" };
            personalProfiles.push({
              name,
              iconName: undefined,
              description: pm.description,
              color: pm.color,
              role: "",
              userColor: "#000",
              bgColor: "#fff",
              personal: true,
            });
          });

          let list = defaults;
          if (
            personalProfiles.length &&
            (meta.role === "premium" || meta.role === "admin")
          ) {
            const arr = [...defaults];
            personalProfiles.forEach((pp, idx) => arr.splice(1 + idx, 0, pp));
            list = arr;
          }
          setProfiles(list);
        } else {
          console.error("[profile-list]", meta.error);
        }
      } catch (err) {
        console.error("[profile-list fetch]", err);
      }
      setLoadingProfiles(false);
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
    ({ userId, sessionId, startingPrompts, closingTrigger }) => {
      if (debug) {
        console.log("[Debug] session ready", { userId, sessionId });
      }

      setUserId(userId);
      setSessionId(sessionId);
      setStartingPrompts(startingPrompts);
      setClosingTrigger(closingTrigger);
      setSessionIsFresh(true);
    },
    [
      setUserId,
      setSessionId,
      setStartingPrompts,
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
    closingTrigger,
    setMessage,
    setEntries,
    setLoading,
    setSessionIsFresh,
    setIsClosing,
  });

  const handleSelectProfile = (p: ProfileCardData) => {
    setProfile(p.name);
    setShowProfileSelect(false);
  };

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
    try {
      const data = await apiFetch<{
        entries?: Entry[];
        closingTrigger?: string;
      }>("/chatload", {
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
      setLoadingEntries(false);
    } catch (err) {
      console.error("[chatload] fetch error:", err);
      setLoadingEntries(false);
    } finally {
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
    if (loadingProfiles)
      return (
        <SpiralLoader
          userColor={currentStyle["--user-color"] || "#7A4DFF"}
          aiColor={currentStyle["--ai-color"] || "#FFB347"}
        />
      );
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProfileCarousel profiles={profiles} onSelect={handleSelectProfile} />
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
    <div
      className="reflecta-chat"
      style={{
        ...currentStyle,
        display: "flex",
        height: "100vh",
        flexDirection: "row",
      }}
    >
      <ProfileSelectorSidebar />
      <div
        style={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}
      >
        <ChatMessagesList
          entries={entries}
          loadingEntries={loadingEntries}
          sessionIsFresh={sessionIsFresh}
          startingPrompts={startingPrompts}
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
          isClosing={isClosing}
          assistantReplyCount={assistantReplyCount}
          setIsClosing={setIsClosing}
          setEntries={setEntries}
          currentStyle={currentStyle}
        />
      </div>
      <div
        style={{
          flex: "0 0 30%",
          overflowY: "auto",
          background: "#f7f7f7",
          borderLeft: "1px solid #ddd",
          padding: "1rem",
          height: "100vh",
        }}
      >
        <ReflectiveMemoryPanel sessionId={sessionId} handleSend={handleSend} />
      </div>
    </div>
  );
}
