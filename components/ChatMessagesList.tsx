// components/ChatMessagesList.tsx
import React from 'react';
import SpiralLoader from './SpiralLoader';
import ThinkingDots from './ThinkingDots';
import StartingPromptSelector from './StartingPromptSelector';
import SessionLabelBubble from './SessionLabelBubble';
import ScrollToBottomButton from './ScrollToBottomButton';


interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ChatMessagesListProps {
  entries: Entry[];
  loadingEntries: boolean;
  sessionIsFresh: boolean;
  startingPrompts: { label: string; message: string }[];
  onSelectPrompt: (prompt: string) => void;
  currentStyle: Record<string, string>;
  sessionId: string | null;
  bottomRef: React.RefObject<HTMLDivElement>;
  showScrollDown: boolean;
  messagesRef: React.RefObject<HTMLDivElement>;
}

export function ChatMessagesList({
  entries,
  loadingEntries,
  sessionIsFresh,
  startingPrompts,
  onSelectPrompt,
  currentStyle,
  sessionId,
  bottomRef,
  showScrollDown,
  messagesRef,
}: ChatMessagesListProps) {
  return (
    <div
      className="reflecta-messages"
      ref={messagesRef}
      style={{ flex: 1, overflowY: 'auto', padding: '1rem', position: 'relative' }}
    >
      {loadingEntries && !entries.length ? (
        <SpiralLoader
          userColor={currentStyle['--user-color'] || '#7A4DFF'}
          aiColor={currentStyle['--ai-color'] || '#FFB347'}
        />
      ) : entries.length === 0 && sessionIsFresh ? (
        <StartingPromptSelector
          prompts={startingPrompts}
          onSelectPrompt={onSelectPrompt}
          aiColor={currentStyle['--ai-color']}
          userColor={currentStyle['--user-color']}
        />
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className={`reflecta-message ${entry.role}`}>
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
              color={currentStyle['--ai-color'] || '#444'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
