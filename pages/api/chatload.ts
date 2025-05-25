// 📁 pages/api/chatload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { userId, profile, limit = 20, offset = 0 } = req.body;

  if (!userId || !profile) {
    return res.status(400).json({ error: 'Missing userId or profile' });
  }

  // 🔹 1. Legutóbbi conversation ID lekérése
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('profile', profile)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (convError || !conversation) {
    return res.status(404).json({ error: 'No conversation found' });
  }

  const conversationId = conversation.id;

  // 🔹 2. Session ID-k ehhez a conversationhöz
  const { data: sessions, error: sessError } = await supabase
    .from('sessions')
    .select('id')
    .eq('conversation_id', conversationId);

  if (sessError || !sessions?.length) {
    return res.status(404).json({ error: 'No sessions found for conversation' });
  }

  const sessionIds = sessions.map((s) => s.id);
  const latestSessionId = sessionIds[sessionIds.length - 1];

  // 🔹 3. Lapozott entries
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, role, content, created_at')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (entriesError) {
    return res.status(500).json({ error: 'Failed to fetch entries' });
  }

  // 🔹 4. Closing trigger
  const { data: metadata, error: metaError } = await supabase
    .from('profile_metadata')
    .select('closing_trigger')
    .eq('profile', profile)
    .single();

  if (metaError || !metadata) {
    return res.status(500).json({ error: 'Failed to fetch profile metadata' });
  }

  return res.status(200).json({
    conversationId,
    sessionId: latestSessionId,
    sessionIds,
    entries,
    closingTrigger: metadata.closing_trigger || ''
  });
}
