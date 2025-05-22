// File: pages/api/user.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wp_user_id, email } = req.body;

  if (!wp_user_id || !email) {
    return res.status(400).json({ error: 'Missing wp_user_id or email' });
  }

  // 1. Megpróbáljuk lekérni a user-t
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('wp_user_id', wp_user_id)
    .maybeSingle();

  if (fetchError) {
    console.error('[Reflecta] Fetch hiba:', fetchError.message);
    return res.status(500).json({ error: fetchError.message });
  }

  if (existingUser) {
    console.log('[Reflecta] Meglévő user ID:', existingUser.id);
    return res.status(200).json({ user_id: existingUser.id });
  }

  // 2. Ha nincs, létrehozzuk (de nem kérjük vissza azonnal)
  const anon_token = uuidv4();

  const { error: insertError } = await supabase
    .from('users')
    .insert({ wp_user_id, email, anon_token });

  if (insertError) {
    console.error('[Reflecta] Insert hiba:', insertError.message);
    return res.status(500).json({ error: insertError.message });
  }

  // 3. Újra lekérjük
  const { data: newUser, error: refetchError } = await supabase
    .from('users')
    .select('id')
    .eq('wp_user_id', wp_user_id)
    .maybeSingle();

  if (refetchError || !newUser) {
    console.error('[Reflecta] Új lekérés hiba:', refetchError?.message || 'nincs adat');
    return res.status(500).json({ error: 'User created, but not found.' });
  }

  console.log('[Reflecta] Új user ID:', newUser.id);
  return res.status(200).json({ user_id: newUser.id });
}
