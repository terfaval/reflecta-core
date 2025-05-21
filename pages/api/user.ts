// File: pages/api/user.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wp_user_id, email } = req.body;

  if (!wp_user_id || !email) {
    return res.status(400).json({ error: 'Missing wp_user_id or email' });
  }

  // 1. Ellenőrizzük, létezik-e már ez a wp_user_id
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('wp_user_id', wp_user_id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  // 2. Ha nem létezik, beszúrjuk új tokennel
  if (!existingUser) {
    const anon_token = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('users')
      .insert({ wp_user_id, email, anon_token });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
  }

  return res.status(200).json({ status: 'ok' });
}
