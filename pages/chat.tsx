import React from 'react'; 

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { profileStyles, buttonStyles } from '../styles/profileStyles';
import UserErrorDisplay from '../components/UserErrorDisplay';
import SpiralLoader from '../components/SpiralLoader';
import ThinkingDots from '../components/ThinkingDots';
import ScrollToBottomButton from '../components/ScrollToBottomButton';
import StartingPromptSelector from '../components/StartingPromptSelector';
import SessionLabelBubble from '../components/SessionLabelBubble';
import ReflectiveMemoryPanel from '../components/ReflectiveMemoryPanel';
import ProfileSelectorSidebar from '../components/ProfileSelectorSidebar';
import ProfileCarousel, { ProfileCard } from '@/components/ProfileCarousel';
import { useUserSession } from '../hooks/useUserSession';
import { useAutoTextareaResize } from '../hooks/useAutoTextareaResize';
import { ChatFooter } from '../components/ChatFooter';
import { ChatMessagesList } from '../components/ChatMessagesList';
import { useScrollHandler } from '../hooks/useScrollHandler';
import { useHandleSend } from '../hooks/useHandleSend';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const DEFAULT_PROFILES: { name: string; icon: string }[] = [
  { name: 'Reflecta', icon: 'https://beenook.hu/wp-content/uploads/2025/05/00_reflecta.svg' },
  { name: 'Akasza', icon: 'https://beenook.hu/wp-content/uploads/2025/05/01_akasza.svg' },
  { name: 'Éana', icon: 'https://beenook.hu/wp-content/uploads/2025/05/02_eana.svg' },
  { name: 'Luma', icon: 'https://beenook.hu/wp-content/uploads/2025/05/03_luma.svg' },
  { name: 'Sylva', icon: 'https://beenook.hu/wp-content/uploads/2025/05/04_sylva.svg' },
  { name: 'Zentó', icon: 'https://beenook.hu/wp-content/uploads/2025/05/05_zento.svg' },
  { name: 'Oneiros', icon: 'https://beenook.hu/wp-content/uploads/2025/05/09_oneiros.svg' },
  { name: 'Kairos', icon: 'https://beenook.hu/wp-content/uploads/2025/05/06_kairos.svg' },
  { name: 'Noe', icon: 'https://beenook.hu/wp-content/uploads/2025/05/07_noe.svg' },
];

export default function ChatPage() {
  const { profile, setProfile } = useProfileContext();
  const router = useRouter();
  const debug = 'debug' in (router.query || {});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [closingTrigger, setClosingTrigger] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { userId, setUserId, userInitialized, userError } = useUserContext();
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [startingPrompts, setStartingPrompts] = useState<{ label: string; message: string }[]>([]);
  const [sessionIsFresh, setSessionIsFresh] = useState(false);
  const [page, setPage] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const limit = 20;
  const isFetchingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const currentStyle = profileStyles[profile as string] || {};
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // waiting for user initialization is handled in UserProvider

  useEffect(() => {
    if (debug) console.log('[Debug] profile', profile);
  }, [debug, profile]);

  useEffect(() => {
    if (debug) console.log('[Debug] userId', userId);
  }, [debug, userId]);

  useEffect(() => {
    if (!userId || profile) return;
    const load = async () => {
      setLoadingProfiles(true);
      try {
        const res = await fetch(`${API_HOST}/last-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok && data.profile && data.sessionId) {
          setProfile(data.profile);
          setSessionId(data.sessionId);
          setLoadingProfiles(false);
          return;
        }
      } catch (err) {
        console.error('[last-session]', err);
      }
      try {
        const names = DEFAULT_PROFILES.map(p => p.name);
        const resp = await fetch(`${API_HOST}/profile-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, names }),
        });
        const meta = await resp.json();
        if (resp.ok) {
          const map: Record<string, { description: string; color: string }> = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = { description: p.description, color: p.color };
          });
          setProfiles(
            DEFAULT_PROFILES.map(p => ({
              ...p,
              description: map[p.name]?.description || '',
              color: map[p.name]?.color || '#fff',
              userColor: (profileStyles[p.name] || {})['--user-color'] || '#000',
            }))
          );
        } else {
          console.error('[profile-list]', meta.error);
        }
      } catch (err) {
        console.error('[profile-list fetch]', err);
      }
      setLoadingProfiles(false);
      setShowProfileSelect(true);
    };
    load();
  }, [userId, profile, setProfile]);

  useEffect(() => {
    if (debug) console.log('[Debug] sessionId', sessionId);
  }, [debug, sessionId]);

  useEffect(() => {
    if (debug) console.log('[Debug] entries', entries.length);
  }, [debug, entries]);

  const handleReady = useCallback(
    ({ userId, sessionId, startingPrompts, closingTrigger }) => {

            if (debug) {
        console.log('[Debug] session ready', { userId, sessionId });
      }

      setUserId(userId);
      setSessionId(sessionId);
      setStartingPrompts(startingPrompts);
      setClosingTrigger(closingTrigger);
      setSessionIsFresh(true);
    },
    [setUserId, setSessionId, setStartingPrompts, setClosingTrigger, setSessionIsFresh]
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
    setPage(prev => {
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

const handleSelectProfile = (p: ProfileCard) => {
    setProfile(p.name);
    setShowProfileSelect(false);
  };

useEffect(() => {
    if (debug) console.log('[Debug] ChatPage render');
  });

  useEffect(() => {
    if (debug) console.log('[Debug] loadingEntries', loadingEntries);
  }, [debug, loadingEntries]);

  const assistantReplyCount = useMemo(() => {
    return entries.filter(e => e.role === 'assistant' && e.content !== '__thinking__').length;
  }, [entries]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchMoreEntries = async (pageIndex: number) => {
    if (!userId || !profile || isFetchingRef.current) return;

if (debug) console.log('[Debug] fetching page', pageIndex);

    isFetchingRef.current = true;
    try {
      const res = await fetch(`${API_HOST}/chatload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile, offset: pageIndex * limit, limit }),
      });
      const data = await res.json();

      if (debug) console.log('[Debug] fetchMoreEntries result', data);

      if (data?.entries?.length) {
        setSessionIsFresh(false);
        setClosingTrigger(data.closingTrigger);
        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newOnes = data.entries.filter(e => !existingIds.has(e.id));
          return [...newOnes, ...prev];
        });
      }
      setLoadingEntries(false);
    } catch (err) {
      console.error('[chatload] fetch error:', err);
      setLoadingEntries(false);
    } finally {
      isFetchingRef.current = false;

      if (debug) console.log('[Debug] fetch complete');
    }
  };

  useEffect(() => {
    if (debug) console.log('[Debug] fetchMoreEntries called. Page:', page);
  }, [debug, page]);

  useEffect(() => {
    if (!profile || typeof profile !== 'string' || !userId || !sessionId) return;
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
        userColor={currentStyle['--user-color'] || '#7A4DFF'}
        aiColor={currentStyle['--ai-color'] || '#FFB347'}
      />
    );
  }

  if (showProfileSelect || (userInitialized && !profile && !sessionId)) {
    if (loadingProfiles)
      return (
        <SpiralLoader
          userColor={currentStyle['--user-color'] || '#7A4DFF'}
          aiColor={currentStyle['--ai-color'] || '#FFB347'}
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
        userColor={currentStyle['--user-color'] || '#7A4DFF'}
        aiColor={currentStyle['--ai-color'] || '#FFB347'}
      />
    );
  }

  return (
  <div
      className="reflecta-chat"
      style={{ ...currentStyle, display: 'flex', height: '100vh', flexDirection: 'row' }}
    >
      <ProfileSelectorSidebar />
      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
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
          flex: '0 0 30%',
          overflowY: 'auto',
          background: '#f7f7f7',
          borderLeft: '1px solid #ddd',
          padding: '1rem',
          height: '100vh',
        }}
      >
        <ReflectiveMemoryPanel
          sessionId={sessionId}
          handleSend={handleSend}
        />
      </div>
    </div>
  );
}
