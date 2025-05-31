// pages/api/preferences/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, preferences } = req.body;

  if (!user_id || typeof preferences !== 'object') {
    return res.status(400).json({ error: 'Missing user_id or preferences' });
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id, ...preferences }, { onConflict: 'user_id' });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
