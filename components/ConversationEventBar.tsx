import React, { useEffect, useState } from 'react';
import styles from './conversationEventBar.module.css';

interface EventItem {
  id: string;
  label: string;
  ref: React.RefObject<HTMLDivElement>;
}

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  events: EventItem[];
  scrollTo: (ref: React.RefObject<HTMLDivElement>) => void;
  colors: {
    userColor: string;
    aiColor: string;
    bgColor: string;
  };
}

const ConversationEventBar: React.FC<Props> = ({ containerRef, events, scrollTo, colors }) => {
  const [positions, setPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const updatePositions = () => {
      const containerHeight = containerRef.current!.scrollHeight;
      const newPos: Record<string, number> = {};
      events.forEach(event => {
        if (event.ref.current) {
          newPos[event.id] = (event.ref.current.offsetTop / containerHeight) * 100;
        }
      });
      setPositions(newPos);
    };

    updatePositions();
    const observer = new ResizeObserver(updatePositions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [events, containerRef]);

  return (
    <div className={styles.eventBarContainer}>
      {events.map(event => (
        <button
          key={event.id}
          className={styles.eventButton}
          onClick={() => scrollTo(event.ref)}
          style={{
            top: `${positions[event.id] || 0}%`,
            backgroundColor: colors.aiColor,
            borderColor: colors.userColor,
            color: colors.userColor,
          }}
        >
          <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span
            className={styles.label}
            style={{
              backgroundColor: colors.userColor,
              color: colors.bgColor,
            }}
          >
            {event.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ConversationEventBar;
