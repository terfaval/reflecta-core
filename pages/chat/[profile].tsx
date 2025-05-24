import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { profileStyles } from '../../styles/profileStyles';

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

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const currentStyle = profileStyles[profile as string] || {};

  // 🔽 Automatikus görgetés az utolsó üzenethez
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

// 🔝 Egyszeri görgetés az oldal tetejére
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);


  // 🔹 Textarea auto-height
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

  // 🔹 WordPress-ből érkező user info
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

  // 🔹 Chatload endpoint használata (session + entries + closing_trigger)
  useEffect(() => {
    if (!profile || typeof profile !== 'string' || !userId) return;

    fetch('/api/chatload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile }),
    })
      .then(res => res.json())
      .then(({ sessionId, entries, closingTrigger }) => {
        setSessionId(sessionId);
        setEntries(entries);
        setClosingTrigger(closingTrigger);
      })
      .catch(console.error);
  }, [profile, userId]);

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
      id: thinkingId, role: 'assistant', content: '…', created_at: new Date().toISOString(),
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
      <div className="reflecta-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
      }}>
        {entries.map(entry => (
          <div key={entry.id} className={`reflecta-message ${entry.role}`}>
            <p>{entry.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
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
