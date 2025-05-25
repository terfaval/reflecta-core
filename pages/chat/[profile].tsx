import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { profileStyles } from '../../styles/profileStyles';
import SpiralLoader from '../../components/SpiralLoader';
import ThinkingDots from '../../components/ThinkingDots';
import ScrollToBottomButton from '../../components/ScrollToBottomButton';

interface Entry {
  id: string;
  role: 'user' | 'assistant';
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
  const [page, setPage] = useState(0);
  const limit = 20;
  const isFetchingRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const currentStyle = profileStyles[profile as string] || {};

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
          .then(({ user_id }) => setUserId(user_id))
          .catch(console.error);
      }
    };
    window.addEventListener('message', handleWPUser);
    return () => window.removeEventListener('message', handleWPUser);
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
      console.log('[chatload] response:', data);

      if (data?.entries?.length) {
        setSessionId(data.sessionId);
        setClosingTrigger(data.closingTrigger);

        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newOnes = data.entries.filter(e => !existingIds.has(e.id));
          return [...newOnes, ...prev];
        });

        if (data.entries?.length > 0) {
          console.log('[chatload] first entry:', data.entries[0]);
        }
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
    if (!profile || typeof profile !== 'string' || !userId) return;
    setPage(0);
    setEntries([]);
    fetchMoreEntries(0);
  }, [profile, userId]);

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
          console.log('[scroll] requesting page:', nextPage);
          fetchMoreEntries(nextPage);
          return nextPage;
        });
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loading]);

  useEffect(() => {
    console.log('[state] entries state updated:', entries.length);
    console.table(entries.map(e => ({ id: e.id, role: e.role, created: e.created_at })));
  }, [entries]);

  const handleSend = async (override?: string) => {
    const text = override || message;
    if (!text.trim() || !sessionId) return;
    setLoading(true);

    const newEntry: Entry = {
      id: `${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setEntries(prev => [...prev, newEntry]);
    setMessage('');

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
    setEntries(prev =>
      prev.map(e => (e.id === thinkingId ? { ...e, content } : e))
    );
    setLoading(false);
  };

  return (
    <div className="reflecta-chat" style={{
      ...currentStyle,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>
      <div
        className="reflecta-messages"
        ref={messagesRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          position: 'relative',
        }}
      >
        {loadingEntries && !entries.length ? (
          <SpiralLoader
            userColor={currentStyle['--user-color'] || '#7A4DFF'}
            aiColor={currentStyle['--ai-color'] || '#FFB347'}
          />
        ) : (
          entries.length === 0 ? (
            <div className="reflecta-empty-state">
              <p>Még nincs üzenet ebben a beszélgetésben.</p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className={`reflecta-message ${entry.role}`}>
                {entry.content === '__thinking__' ? (
                  <ThinkingDots />
                ) : (
                  <p>{entry.content}</p>
                )}
              </div>
            ))
          )
        )}
        <div ref={bottomRef} style={{ scrollMarginBottom: '60px' }} />

        {showScrollDown && (
          <div style={{
            position: 'sticky',
            bottom: '-10px',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ pointerEvents: 'auto' }}>
              <ScrollToBottomButton
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                color={currentStyle['--ai-color'] || '#444'}
              />
            </div>
          </div>
        )}
      </div>

      <div className="reflecta-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Írd be, amit meg szeretnél osztani..."
          disabled={loading}
        />

        <div className="reflecta-input-buttons">
          {closingTrigger && (
            <button
              onClick={async () => {
                if (!closingTrigger || !sessionId) return;
                await handleSend(closingTrigger);
                await fetch('/api/session/close', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId }),
                });
              }}
              className="reflecta-close-animated"
              aria-label="Zárás"
            >
              <svg className="reflecta-close-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
              <span className="reflecta-close-label">Mára elég volt</span>
            </button>
          )}

          <button
            className={`reflecta-send-button ${loading ? 'reflecta-send-loading' : ''}`}
            onClick={() => handleSend()}
            disabled={loading}
            aria-label="Küldés"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
