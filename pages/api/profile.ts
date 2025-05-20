// File: /pages/api/profile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = req.query.name;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({ error: 'Missing profile name' });
  }

  const name = decodeURIComponent(raw);

  const { data, error } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', name)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Profile metadata not found' });

  res.status(200).json(data);
}
