// components/ChatMessagesList.tsx
import React from 'react';
import SpiralLoader from './SpiralLoader';
import ThinkingDots from './ThinkingDots';
import StartingPromptDisplay from './StartingPromptDisplay';
import SessionLabelBubble from './SessionLabelBubble';
import ScrollToBottomButton from './ScrollToBottomButton';
import ResponseTweakButtons from './ResponseTweakButtons';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ChatMessagesListProps {
  entries: Entry[];
  loadingEntries: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  sessionIsFresh: boolean;
  startingPrompt: string;
  onSelectPrompt: (prompt: string) => void;
  onTweak: (prompt: string) => void;
  currentStyle: Record<string, string>;
  sessionId: string | null;
  bottomRef: React.RefObject<HTMLDivElement>;
  showScrollDown: boolean;
  messagesRef: React.RefObject<HTMLDivElement>;
}

export function ChatMessagesList({
  entries,
  loadingEntries,
  loadError,
  onRetryLoad,
  sessionIsFresh,
  startingPrompt,
  onSelectPrompt,
  onTweak,
  currentStyle,
  sessionId,
  bottomRef,
  showScrollDown,
  messagesRef,
}: ChatMessagesListProps) {
  const lastAssistantIndex = entries.map((e) => e.role).lastIndexOf('assistant');
  return (
    <div
      className="reflecta-messages"
      ref={messagesRef}
      data-session-id={sessionId || undefined}
      style={{ flex: 1, overflowY: 'auto', padding: '1rem', position: 'relative' }}
    >
      {loadError && !entries.length ? (
        <div style={{ textAlign: 'center' }}>
          <p>{loadError}</p>
          {onRetryLoad && (
            <button onClick={onRetryLoad} style={{ marginTop: '4px' }}>
              Újra
            </button>
          )}
        </div>
      ) : loadingEntries && !entries.length ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <SpiralLoader
            userColor={currentStyle['--user-color']}
            aiColor={currentStyle['--ai-color']}
            fullScreen={false}
          />
        </div>
      ) : entries.length === 0 && sessionIsFresh ? (
        <div style={{ textAlign: 'center' }}>
          <StartingPromptDisplay
            prompt={startingPrompt}
            color={currentStyle['--user-color']}
          />
        </div>
      ) : (
        entries.map((entry, index) => (
          <div key={entry.id} className={`reflecta-message-block ${entry.role}`}> 
            <div className={`reflecta-message ${entry.role}`}> 
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
            {entry.role === 'assistant' &&
              index === lastAssistantIndex &&
              entry.content !== '__thinking__' && (
                <div className="reflecta-tweak-container">
                  <ResponseTweakButtons
                    onTweak={onTweak}
                    userColor={currentStyle['--user-color']}
                  />
                  {/* TODO: pass disabled or loading props when available */}
                </div>
              )}
          </div>
        ))
      )}

      <div ref={bottomRef} style={{ scrollMarginBottom: '60px' }} />
      {showScrollDown && (
        <div
          style={{
            position: 'sticky',
            bottom: '-10px',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <ScrollToBottomButton
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              color={currentStyle['--ai-color']}
            />
          </div>
        </div>
      )}
    </div>
  );
}
