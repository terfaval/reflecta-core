import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessagesList } from '@/components/ChatMessagesList';
import { ChatFooter } from '@/components/ChatFooter';
import { useProfileContext } from '@/contexts/ProfileContext';
import { apiFetch } from '@/lib/api';
import { useAutoTextareaResize } from '@/hooks/useAutoTextareaResize';
import { useScrollHandler } from '@/hooks/useScrollHandler';
import { useErrorToast } from '@/hooks/useErrorToast';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function GuestChatPage() {
  const { setProfile } = useProfileContext();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [startingPrompt, setStartingPrompt] = useState('');
  const [sessionIsFresh, setSessionIsFresh] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const guestIdRef = useRef<string>(uuidv4());
  const [showScrollDown, setShowScrollDown] = useState(false);
  const errorToast = useErrorToast();

  const DEFAULT_STYLE: Record<string, string> = {
    '--bg-color': '#ffffff',
    '--user-color': '#7D9EDF',
    '--ai-color': '#C5DAF1',
  };
  const [currentStyle] = useState<Record<string, string>>(DEFAULT_STYLE);

  useEffect(() => {
    setProfile('Reflecta');
  }, [setProfile]);

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        const data = await apiFetch<{ prompt: string }>('/api/starting-prompt', {
          method: 'POST',
          body: JSON.stringify({ userId: 'guest', profile: 'Reflecta' }),
        });
        if (data?.prompt) setStartingPrompt(data.prompt);
      } catch (err) {
        console.error('[guest starting prompt]', err);
        errorToast('Nem sikerült betölteni az indító üzenetet.');
      }
    };
    loadPrompt();
  }, []);

  useAutoTextareaResize();

  useScrollHandler({
    ref: messagesRef,
    loading,
    onNearTop: () => {},
    onScrollBottomStateChange: setShowScrollDown,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSend = async (text?: string) => {
    const content = (typeof text === 'string' ? text : message).trim();
    if (!content) return;

    setMessage('');
    setSessionIsFresh(false);
    const userEntry: Entry = {
      id: `${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [...prev, userEntry]);

    const history = [...entries, userEntry].map(e => ({ role: e.role, content: e.content }));
    const thinkingId = `${Date.now()}-thinking`;
    setEntries(prev => [...prev, { id: thinkingId, role: 'assistant', content: '__thinking__', created_at: new Date().toISOString() }]);

    setLoading(true);
    try {
      const resp = await apiFetch<{ content?: string }>('/api/guest/respond', {
        method: 'POST',
        body: JSON.stringify({ guestId: guestIdRef.current, profile: 'Reflecta', history, message: content }),
      });
      const reply = resp?.content ?? '';
      setEntries(prev => prev.map(e => e.id === thinkingId ? { ...e, content: reply } : e));
    } catch (err) {
      console.error('[guest/respond]', err);
      setEntries(prev => prev.map(e => e.id === thinkingId ? { ...e, content: 'Hiba történt' } : e));
      errorToast('Nem sikerült válaszolni. Kérlek próbáld újra.');
    }
    setLoading(false);
  };

  const assistantReplyCount = entries.filter(e => e.role === 'assistant' && e.content !== '__thinking__').length;

  return (
    <div className="reflecta-chat chat-layout" style={currentStyle}>
        <div className="chat-profile-sidebar">
        <div className="reflecta-placeholder"></div>
      </div>
      <div className="chat-area">
        <ChatMessagesList
          entries={entries}
          loadingEntries={false}
          loadError={null}
          onRetryLoad={undefined}
          sessionIsFresh={sessionIsFresh}
          startingPrompt={startingPrompt}
          onSelectPrompt={handleSend}
          onTweak={handleSend}
          currentStyle={currentStyle}
          sessionId={null}
          bottomRef={bottomRef}
          showScrollDown={showScrollDown}
          messagesRef={messagesRef}
        />
        <ChatFooter
          message={message}
          setMessage={setMessage}
          loading={loading}
          handleSend={handleSend}
          closingTrigger=""
          sessionId={null}
          setSessionId={() => {}}
          isClosing={false}
          assistantReplyCount={assistantReplyCount}
          setIsClosing={() => {}}
          setEntries={setEntries}
          currentStyle={currentStyle}
        />
      </div>
      <div className="chat-memory-panel">
        <div className="reflecta-placeholder"> </div>
      </div>
    </div>
  );
}