import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, profile } = req.body;

  if (!userId || !profile) {
    console.warn('[Reflecta] Hiányzó session paraméterek:', req.body);
    return res.status(400).json({ error: 'Missing userId or profile' });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('profile', profile)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    if (existing && !existing.ended_at) {
      return res.status(200).json({ session: existing });
    }

    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert([{ user_id: userId, profile }])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ session: data });
  } catch (err: any) {
    console.error('[Reflecta] session.ts hiba:', err.message || err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
