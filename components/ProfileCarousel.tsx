import React, { useState } from 'react';
import ProfileCardComponent, { ProfileCardProps } from './ProfileCard';

export interface ProfileCard extends Omit<ProfileCardProps, 'onSelect'> {}

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
          <ProfileCardComponent key={p.name} {...p} onSelect={() => onSelect(p)} />
        ))}
      </div>
      <button onClick={next} disabled={page >= totalPages - 1} className="px-2">
        ▶
      </button>
    </div>
  );
}