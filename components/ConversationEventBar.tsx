import React, { useEffect, useState } from 'react';
import styles from './ConversationEventBar.module.css';

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
    <div
      className={styles.eventBarContainer}
      style={{ background: 'rgba(0, 255, 0, 0.05)', zIndex: 1000 }} // debug háttér, hogy lásd
    >
      {events.map(event => (
        <button
          key={event.id}
          onClick={() => scrollTo(event.ref)}
          style={{
            position: 'absolute',
            top: `${positions[event.id] || 0}%`,
            right: '0px',
            zIndex: 1001,
            background: colors.aiColor,
            color: colors.userColor,
            border: `2px solid ${colors.userColor}`,
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            pointerEvents: 'auto',
            transition: 'opacity 0.2s',
          }}
        >
          ⬤ {event.label}
        </button>
      ))}
    </div>
  );
};

export default ConversationEventBar;
