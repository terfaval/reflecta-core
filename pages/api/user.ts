import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wp_user_id, email } = req.body;

  if (!wp_user_id || !email) {
    console.warn('[Reflecta] Hiányzó wp_user_id vagy email:', req.body);
    return res.status(400).json({ error: 'Missing wp_user_id or email' });
  }

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('wp_user_id', wp_user_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existingUser) {
      const anon_token = uuidv4();
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({ wp_user_id, email, anon_token })
        .select('id')
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({ user_id: data.id });
    }

    return res.status(200).json({ user_id: existingUser.id });
  } catch (err: any) {
    console.error('[Reflecta] user.ts hiba:', err.message || err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
