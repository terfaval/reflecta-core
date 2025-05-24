import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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

  const currentStyle = profileStyles[profile as string] || {};

  // 🔹 Automatikus textarea magasságnövelés gépeléskor
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

  // 🔹 WordPress-ből jövő iframe useradatok
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

  // 🔹 Session és profil betöltés
  useEffect(() => {
    if (!profile || typeof profile !== 'string' || !userId) return;

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data?.session?.id) throw new Error('Hiányzó session.id');
        setSessionId(data.session.id);
        return fetch(`/api/entries?sessionId=${data.session.id}`);
      })
      .then(res => res.json())
      .then(data => setEntries(data.entries || []))
      .catch(console.error);

    fetch(`/api/profile?name=${profile}`)
      .then(res => res.json())
      .then(({ closing_trigger }) => setClosingTrigger(closing_trigger))
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
      ...currentStyle, // 👈 megmaradnak a profilalapú színek!
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
}}>
      <div className="reflecta-messages">
        {entries.map(entry => (
          <div key={entry.id} className={`reflecta-message ${entry.role}`}>
            <p>{entry.content}</p>
          </div>
        ))}
      </div>

      <div className="reflecta-input">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Írd be, amit meg szeretnél osztani..."
          disabled={loading}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            className="reflecta-send-button"
            onClick={() => handleSend()}
            disabled={loading}
            aria-label="Küldés"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

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
              className="reflecta-close-button"
              aria-label="Zárás"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
