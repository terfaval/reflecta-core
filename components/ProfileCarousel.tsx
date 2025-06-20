import React, { useState } from 'react';

export interface ProfileCard {
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface Props {
  profiles: ProfileCard[];
  onSelect: (p: ProfileCard) => void;
}

export default function ProfileCarousel({ profiles, onSelect }: Props) {
  const [page, setPage] = useState(0);
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(profiles.length / perPage));

  const start = page * perPage;
  const visible = profiles.slice(start, start + perPage);

  const prev = () => setPage(p => Math.max(0, p - 1));
  const next = () => setPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="flex items-center gap-4">
      <button onClick={prev} disabled={page === 0} className="px-2">
        ◀
      </button>
      <div className="flex gap-4">
        {visible.map(p => (
          <div
            key={p.name}
            onClick={() => onSelect(p)}
            className="cursor-pointer border rounded-lg p-4 w-48 text-center transition-colors"
            style={{
              backgroundColor: p.color,
              borderColor: p.color,
              color: '#000',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#000';
              e.currentTarget.style.color = p.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = p.color;
              e.currentTarget.style.color = '#000';
            }}
          >
            <img src={p.icon} alt="" className="w-12 h-12 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">{p.name}</h3>
            <p className="text-sm">{p.description}</p>
          </div>
        ))}
      </div>
      <button onClick={next} disabled={page >= totalPages - 1} className="px-2">
        ▶
      </button>
    </div>
  );
}