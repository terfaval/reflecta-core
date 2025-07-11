import React, { useEffect, useRef, useState } from 'react';
import { ChatMessagesList } from '@/components/ChatMessagesList';
import { ChatFooter } from '@/components/ChatFooter';
import { useProfileContext } from '@/contexts/ProfileContext';
import { apiFetch } from '@/lib/api';
import { useAutoTextareaResize } from '@/hooks/useAutoTextareaResize';
import { useScrollHandler } from '@/hooks/useScrollHandler';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function GuestChatPage() {
  const { setProfile } = useProfileContext();
  const [entries, setEntries] = useState<Entry[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Welcome! You can chat with Reflecta here as a guest.',
    created_at: new Date().toISOString(),
  }]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const DEFAULT_STYLE: Record<string, string> = {
    '--bg-color': '#ffffff',
    '--user-color': '#7D9EDF',
    '--ai-color': '#C5DAF1',
  };
  const [currentStyle] = useState<Record<string, string>>(DEFAULT_STYLE);

  useEffect(() => {
    setProfile('Reflecta');
    sessionStorage.setItem('reflecta_profile', 'Reflecta');
  }, [setProfile]);

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
        body: JSON.stringify({ guestId: 'reflecta-guest', profile: 'Reflecta', history, message: content }),
      });
      const reply = resp?.content ?? '';
      setEntries(prev => prev.map(e => e.id === thinkingId ? { ...e, content: reply } : e));
    } catch (err) {
      console.error('[guest/respond]', err);
      setEntries(prev => prev.map(e => e.id === thinkingId ? { ...e, content: 'Hiba történt' } : e));
    }
    setLoading(false);
  };

  const assistantReplyCount = entries.filter(e => e.role === 'assistant' && e.content !== '__thinking__').length;

  return (
    <div className="reflecta-chat chat-layout" style={currentStyle}>
      <div className="chat-area">
        <ChatMessagesList
          entries={entries}
          loadingEntries={false}
          loadError={null}
          onRetryLoad={undefined}
          sessionIsFresh={false}
          startingPrompt=""
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
    </div>
  );
}