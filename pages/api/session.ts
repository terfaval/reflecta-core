// File: /pages/api/session.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, profile } = req.body;
  if (!userId || !profile) {
    return res.status(400).json({ error: 'Missing userId or profile' });
  }

  // Keressünk létező sessiont
  const { data: existing, error: findError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('profile', profile)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });

  if (existing && !existing.ended_at) {
    return res.status(200).json({ session: existing });
  }

  // Új session létrehozása
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ user_id: userId, profile }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ session: data });
}
