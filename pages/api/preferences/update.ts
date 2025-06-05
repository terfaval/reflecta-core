import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

function isValidPreferences(obj: any): obj is Record<string, any> {
  if (!obj || typeof obj !== 'object') return false;

  const allowedKeys = ['answer_length', 'style_mode', 'guidance_mode', 'tone_preference'];
  return Object.keys(obj).every(key => allowedKeys.includes(key));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, preferences } = req.body;

  if (!user_id || typeof user_id !== 'string' || !isValidPreferences(preferences)) {
    return res.status(400).json({ error: 'Missing or invalid user_id or preferences' });
  }

  const cleanPrefs = {
    user_id,
    answer_length: preferences.answer_length ?? null,
    style_mode: preferences.style_mode ?? null,
    guidance_mode: preferences.guidance_mode ?? null,
    tone_preference: preferences.tone_preference ?? null,
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(cleanPrefs, { onConflict: 'user_id' });

  if (error) {
    console.error('[Update Preferences] Supabase error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
