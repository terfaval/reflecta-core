// File: /pages/chat/[profile].tsx

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

  const userId = 'demo-user'; // később WordPress-ből érkezik majd
  const currentStyle = profileStyles[profile as string] || {};

  // Session és profilmeta betöltése
  useEffect(() => {
    if (!profile || typeof profile !== 'string') return;

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile }),
    })
      .then((res) => res.json())
      .then(({ session }) => {
        setSessionId(session.id);
        // Entryk lekérése
        fetch(`/api/entries?sessionId=${session.id}`)
          .then((res) => res.json())
          .then((data) => setEntries(data.entries || []));
      });

    fetch(`/api/profile?name=${profile}`)
      .then((res) => res.json())
      .then(({ closing_trigger }) => setClosingTrigger(closing_trigger));
  }, [profile]);

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

    setEntries((prev) => [...prev, newEntry]);
    setMessage('');

    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, entry: newEntry }),
    });

    // Válasz betöltése animációval
    const thinkingId = `${Date.now()}-thinking`;
    const thinkingEntry: Entry = {
      id: thinkingId,
      role: 'assistant',
      content: '…',
      created_at: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, thinkingEntry]);

    const res = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const { content } = await res.json();

    setEntries((prev) =>
      prev.map((e) => (e.id === thinkingId ? { ...e, content } : e))
    );

    setLoading(false);
  };

  return (
    <div className="reflecta-chat" style={currentStyle}>
      <h2>Napló: {profile}</h2>
      <div className="reflecta-messages">
        {entries.map((entry) => (
          <div key={entry.id} className={`reflecta-message ${entry.role}`}>
            <p>{entry.content}</p>
          </div>
        ))}
      </div>
      <div className="reflecta-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Írd be, amit meg szeretnél osztani..."
          disabled={loading}
        />
        <button onClick={() => handleSend()} disabled={loading}>
          {loading ? 'Válasz folyamatban...' : 'Küldés'}
        </button>
        {closingTrigger && (
          <button
            onClick={() => handleSend(closingTrigger)}
            className="reflecta-close-button"
            disabled={loading}
          >
            Mára elég volt
          </button>
        )}
      </div>
    </div>
  );
}
