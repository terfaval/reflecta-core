// File: /pages/api/preferences/reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Csak POST metódus engedélyezett' });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Hiányzó user_id paraméter' });
  }

  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        answer_length: null,
        style_mode: null,
        guidance_mode: null,
        tone_preference: null,
      })
      .eq('user_id', user_id);

    if (error) {
      console.error('[Preferences Reset] Hiba:', error.message);
      return res.status(500).json({ error: 'Nem sikerült alaphelyzetbe állítani' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Preferences Reset] Kivétel:', err);
    return res.status(500).json({ error: 'Szerverhiba' });
  }
}
