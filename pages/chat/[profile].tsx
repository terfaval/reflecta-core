// ✅ Reflecta ChatPage with scrollAnchors from system_events
import React from 'react'; 
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, useMemo } from 'react';
import { profileStyles, buttonStyles } from '../../styles/profileStyles';
import SpiralLoader from '../../components/SpiralLoader';
import ThinkingDots from '../../components/ThinkingDots';
import ScrollToBottomButton from '../../components/ScrollToBottomButton';
import StartingPromptSelector from '../../components/StartingPromptSelector';
import SessionLabelBubble from '../../components/SessionLabelBubble';
import { useUserSession } from '../../hooks/useUserSession';
import { useAutoTextareaResize } from '../../hooks/useAutoTextareaResize';
import { ChatFooter } from '../../components/ChatFooter';
import { ChatMessagesList } from '../../components/ChatMessagesList';
import { useScrollHandler } from '../../hooks/useScrollHandler';
import { useHandleSend } from '../../hooks/useHandleSend';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { profile } = router.query;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [closingTrigger, setClosingTrigger] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  useUserSession({
  profile,
  onReady: ({ userId, sessionId, startingPrompts, closingTrigger }) => {
    setUserId(userId);
    setSessionId(sessionId);
    setStartingPrompts(startingPrompts);
    setClosingTrigger(closingTrigger);
    setSessionIsFresh(true);
  },
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

  const assistantReplyCount = useMemo(() => {
    return entries.filter(e => e.role === 'assistant' && e.content !== '__thinking__').length;
  }, [entries]);

  const { prefs: userPreferences, updatePrefs: setUserPreferences } = useUserPreferences(userId);

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
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/chatload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile, offset: pageIndex * limit, limit }),
      });
      const data = await res.json();
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
    }
  };

  useEffect(() => {
    if (!profile || typeof profile !== 'string' || !userId || !sessionId) return;
    setPage(0);
    setEntries([]);
    fetchMoreEntries(0);
  }, [profile, userId, sessionId]);

  return (
  <div className="reflecta-chat" style={{ ...currentStyle, display: 'flex', flexDirection: 'column', height: '100vh' }}>
     <ChatMessagesList
  entries={entries}
  loadingEntries={loadingEntries}
  sessionIsFresh={sessionIsFresh}
  startingPrompts={startingPrompts}
  onSelectPrompt={handleSend}
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
  userPreferences={userPreferences}
  setUserPreferences={setUserPreferences}
/>
      
    </div>
  );
}
