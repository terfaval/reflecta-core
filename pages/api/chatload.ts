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

  console.log('[chatload] ⚙️ REQUEST STARTED');
  console.log('[chatload] ▶️ userId:', userId);
  console.log('[chatload] ▶️ profile:', profile);
  console.log('[chatload] ▶️ limit/offset:', limit, offset);

  if (!userId || !profile) {
    console.log('[chatload] ❌ Missing userId or profile');
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
    console.log('[chatload] ❌ No conversation found', convError, conversation);
    return res.status(404).json({ error: 'No conversation found' });
  }

  console.log('[chatload] ✅ Conversation ID:', conversation.id);
  const conversationId = conversation.id;

  // 🔹 2. Ehhez tartozó összes session ID
  const { data: sessions, error: sessError } = await supabase
    .from('sessions')
    .select('id')
    .eq('conversation_id', conversationId);

  if (sessError || !sessions?.length) {
    console.log('[chatload] ❌ No sessions found', sessError, sessions);
    return res.status(404).json({ error: 'No sessions found for conversation' });
  }

  const sessionIds = sessions.map((s) => s.id);
  const latestSessionId = sessionIds[sessionIds.length - 1];
  console.log('[chatload] ✅ Sessions found:', sessionIds);

  // 🔹 3. Lapozott entries
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, role, content, created_at')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (entriesError) {
    console.log('[chatload] ❌ Failed to fetch entries', entriesError);
    return res.status(500).json({ error: 'Failed to fetch entries' });
  }

  console.log(`[chatload] ✅ Entries returned: ${entries.length}`);

  // 🔹 4. Closing trigger betöltése
  const { data: metadata, error: metaError } = await supabase
    .from('profile_metadata')
    .select('closing_trigger')
    .eq('profile', profile)
    .single();

  if (metaError || !metadata) {
    console.log('[chatload] ❌ Failed to fetch profile metadata', metaError, metadata);
    return res.status(500).json({ error: 'Failed to fetch profile metadata' });
  }

  console.log('[chatload] ✅ Closing trigger:', metadata.closing_trigger);

  return res.status(200).json({
    conversationId,
    sessionId: latestSessionId,
    sessionIds,
    entries,
    closingTrigger: metadata.closing_trigger || ''
  });
}
