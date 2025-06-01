// components/ChatFooter.tsx
import React, { useState } from 'react';
import { buttonStyles } from '../styles/profileStyles';
import { PreferencesPanel } from './PreferencesPanel';
import type { UserPreferences } from '@/lib/types';

interface ChatFooterProps {
  message: string;
  setMessage: (msg: string) => void;
  loading: boolean;
  handleSend: (override?: string) => void;
  closingTrigger: string;
  sessionId: string | null;
  isClosing: boolean;
  assistantReplyCount: number;
  setIsClosing: (v: boolean) => void;
  setEntries: (fn: (prev: any[]) => any[]) => void;
  currentStyle: Record<string, string>;
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: UserPreferences) => void;
}

export function ChatFooter({
  message,
  setMessage,
  loading,
  handleSend,
  closingTrigger,
  sessionId,
  isClosing,
  assistantReplyCount,
  setIsClosing,
  setEntries,
  currentStyle,
  userPreferences,
  setUserPreferences,
}: ChatFooterProps) {
  const [openPreferences, setOpenPreferences] = useState(false);

  return (
    <>
      {/* Preferences panel rendered independently */}
      <PreferencesPanel
  open={openPreferences}
  onClose={() => setOpenPreferences(false)}
  preferences={userPreferences}
  setPreferences={setUserPreferences}
  styleVars={currentStyle}
  userId={userId!}
/>

      <div className="reflecta-input relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Írd be, amit meg szeretnél osztani..."
          disabled={loading}
        />

        {/* Fogaskerék gomb */}
        <button
          onClick={() => setOpenPreferences((v) => !v)}
          className="absolute bottom-3 left-3 p-1 rounded-full"
          style={{ background: 'transparent', color: currentStyle['--user-color'], border: 'none' }}
          aria-label="Válaszstílus beállítások"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

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
    </>
  );
}
