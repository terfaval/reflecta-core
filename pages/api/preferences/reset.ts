// File: /pages/api/preferences/reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // vagy megfelelő token
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

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

    if (error) throw error;

    return res.status(200).json({ message: 'Preferences reset successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}
