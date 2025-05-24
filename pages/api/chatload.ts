// 📁 pages/api/chatload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // belső kulcs kell, ha insert is történik
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { userId, profile } = req.body;

  if (!userId || !profile) return res.status(400).json({ error: 'Missing userId or profile' });

  // 🔹 1. Session keresés vagy létrehozás
  const { data: existingSession, error: findError } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('profile', profile)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let sessionId = existingSession?.id;

  if (!sessionId) {
    const { data: newSession, error: insertError } = await supabase
      .from('sessions')
      .insert({ user_id: userId, profile })
      .select('id')
      .single();

    if (insertError || !newSession) return res.status(500).json({ error: 'Session create failed' });
    sessionId = newSession.id;
  }

  // 🔹 2. Entries betöltése
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (entriesError) return res.status(500).json({ error: 'Entries fetch failed' });

  // 🔹 3. Closing trigger betöltése
  const { data: metadata, error: profileError } = await supabase
    .from('profile_metadata')
    .select('closing_trigger')
    .eq('profile', profile)
    .single();

  if (profileError) return res.status(500).json({ error: 'Profile metadata fetch failed' });

  return res.status(200).json({
    sessionId,
    entries,
    closingTrigger: metadata.closing_trigger || ''
  });
}
