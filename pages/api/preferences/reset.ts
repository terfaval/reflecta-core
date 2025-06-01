// pages/api/preferences/reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Csak POST metódus engedélyezett.' });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Hiányzó user_id.' });
  }

  const { error } = await supabase
    .from('user_preferences')
    .delete()
    .eq('user_id', user_id);

  if (error) {
    console.error('[Supabase Reset Hiba]', error);
    return res.status(500).json({ error: 'Nem sikerült törölni a preferenciákat.' });
  }

  return res.status(200).json({ success: true });
}
