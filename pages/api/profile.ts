// File: /pages/api/profile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const name = req.query.name as string;
  if (!name) return res.status(400).json({ error: 'Missing profile name' });

  const { data, error } = await supabase
    .from('profile_metadata')
    .select('closing_trigger, closing_style')
    .eq('profile', name)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Profile metadata not found' });

  return res.status(200).json(data);
}
