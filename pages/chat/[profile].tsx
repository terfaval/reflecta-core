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

  useEffect(() => {
    const textarea = document.querySelector('.reflecta-input textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const handleInput = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener('input', handleInput);
    return () => textarea.removeEventListener('input', handleInput);
  }, []);

  const loadInitialData = async (user_id: string, profile: string) => {
    try {
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user_id, profile }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionData?.session?.id) return;
      const profileRes = await fetch(`/api/profile?name=${profile}`);
      const profileData = await profileRes.json();
      setStartingPrompts(profileData?.starting_prompts || []);
      setClosingTrigger(profileData?.closing_trigger || '');
      setSessionId(sessionData.session.id);
      setSessionIsFresh(true);
    } catch (err) {
      console.error('[loadInitialData] error:', err);
    }
  };

  useEffect(() => {
    const handleWPUser = (event: MessageEvent) => {
      if (event.data?.type === 'wp_user') {
        const { wp_user_id, email } = event.data;
        if (!wp_user_id || !email) return;
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wp_user_id, email }),
        })
          .then(res => res.json())
          .then(async ({ user_id }) => {
            setUserId(user_id);
            await loadInitialData(user_id, profile as string);
          })
          .catch(console.error);
      }
    };
    window.addEventListener('message', handleWPUser);
    return () => window.removeEventListener('message', handleWPUser);
  }, [profile]);

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

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const handleScroll = () => {
      const nearTop = el.scrollTop < 50;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollDown(!nearBottom);
      if (nearTop && !loading) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchMoreEntries(nextPage);
          return nextPage;
        });
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loading]);


  const handleSend = async (override?: string) => {
    const text = override || message;
    if (!text.trim() || !sessionId) return;
    const isTrigger = text.trim() === closingTrigger.trim();
    setLoading(true);
    setSessionIsFresh(false);

    if (isTrigger) {
      setIsClosing(true);
      try {
        const res = await fetch('/api/session/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (res.ok) {
          const now = new Date().toISOString();
          setEntries(prev => [
            ...prev,
            { id: `${Date.now()}-user-closing`, role: 'user', content: text, created_at: now },
            { id: `${Date.now()}-closure-reply`, role: 'assistant', content: data.closureEntry, created_at: now },
            { id: `${Date.now()}-closure-label`, role: 'system', content: `Szakasz lezárása: ${data.label}`, created_at: now },
          ]);
        } else {
          console.error('[Zárás] Hiba:', data.error);
        }
      } catch (err) {
        console.error('[Zárás] Kivétel:', err);
      }
      setIsClosing(false);
      setMessage('');
      setLoading(false);
      return;
    }

    const newEntry: Entry = {
      id: `${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setEntries(prev => [...prev, newEntry]);
    setMessage('');
    const textarea = document.querySelector('.reflecta-input textarea') as HTMLTextAreaElement | null;
    if (textarea) textarea.style.height = 'auto';

    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, entry: newEntry }),
    });

    const thinkingId = `${Date.now()}-thinking`;
    setEntries(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '__thinking__',
      created_at: new Date().toISOString(),
    }]);

    const res = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const { content } = await res.json();
    setEntries(prev => prev.map(e => (e.id === thinkingId ? { ...e, content } : e)));
    setLoading(false);
  };

  return (
    <div className="reflecta-chat" style={{ ...currentStyle, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
{loadingEntries && !entries.length ? (
  <SpiralLoader userColor={currentStyle['--user-color'] || '#7A4DFF'} aiColor={currentStyle['--ai-color'] || '#FFB347'} />
) : entries.length === 0 && sessionIsFresh ? (
  <StartingPromptSelector
    prompts={startingPrompts}
    onSelectPrompt={handleSend}
    aiColor={currentStyle['--ai-color']}
    userColor={currentStyle['--user-color']}
  />
) : (
  entries.map(entry => {
    return (
      <div key={entry.id} className={`reflecta-message ${entry.role}`} ref={anchorRef || undefined}>
        {entry.content === '__thinking__' ? (
          <ThinkingDots />
        ) : entry.role === 'system' && entry.content.startsWith('Szakasz lezárása:') ? (
          <SessionLabelBubble
            entryId={entry.id}
            initialLabel={entry.content.replace('Szakasz lezárása:', '').trim()}
            userColor={currentStyle['--user-color']}
            aiColor={currentStyle['--ai-color']}
          />
        ) : (
          <p>{entry.content}</p>
        )}
      </div>
    );
  })
)}


        <div ref={bottomRef} style={{ scrollMarginBottom: '60px' }} />
        {showScrollDown && (
          <div style={{ position: 'sticky', bottom: '-10px', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <ScrollToBottomButton onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })} color={currentStyle['--ai-color'] || '#444'} />
            </div>
          </div>
        )}
      </div>
      <div className="reflecta-input">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Írd be, amit meg szeretnél osztani..." disabled={loading} />
        <div className="reflecta-input-buttons">
          <button
            className={`reflecta-send-button ${loading ? 'reflecta-send-loading' : ''} ${buttonStyles.buttonBase} ${loading ? buttonStyles.sendButtonLoading : buttonStyles.sendButton}`}
            onClick={() => handleSend()}
            disabled={loading}
            aria-label="Küldés"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

          {closingTrigger && (
            <button
              onClick={async () => {
                if (!sessionId || isClosing || assistantReplyCount < 3) return;
                setIsClosing(true);
                try {
                  const res = await fetch('/api/session/close', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId }),
                  });
                  const data = await res.json();

                  if (res.ok) {
                    const now = new Date().toISOString();
                    setEntries(prev => [
                      ...prev,
                      { id: `${Date.now()}-user-closing`, role: 'user', content: closingTrigger, created_at: now },
                      { id: `${Date.now()}-closure-reply`, role: 'assistant', content: data.closureEntry, created_at: now },
                      { id: `${Date.now()}-closure-label`, role: 'system', content: `Szakasz lezárása: ${data.label}`, created_at: now },
                    ]);
                  } else {
                    console.error('[Zárás] Hiba:', data.error);
                  }
                } catch (err) {
                  console.error('[Zárás] Kivétel:', err);
                }
                setIsClosing(false);
              }}
              disabled={assistantReplyCount < 3 || isClosing}
              className={`reflecta-close-animated ${buttonStyles.closeAnimated}`}
              aria-label="Zárás"
              style={{
                backgroundColor: currentStyle['--ai-color'] || '#4CAF50',
                color: currentStyle['--user-color'] || '#ffffff',
                opacity: assistantReplyCount < 3 || isClosing ? 0.5 : 1,
                cursor: assistantReplyCount < 3 || isClosing ? 'not-allowed' : 'pointer',
                pointerEvents: assistantReplyCount < 3 || isClosing ? 'none' : 'auto',
                border: `1px solid ${currentStyle['--user-color'] || '#ffffff'}`,
              }}
            >
              <svg
                className={`reflecta-close-icon ${buttonStyles.closeIcon}`}
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={currentStyle['--user-color'] || '#ffffff'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
              <span className={`reflecta-close-label ${buttonStyles.closeLabel}`}>
                {isClosing ? 'Zárás folyamatban...' : 'Mára elég volt'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
