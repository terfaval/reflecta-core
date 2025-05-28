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

  // 1. Conversation ID
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

  // 2. Sessions for this conversation
  const { data: sessions, error: sessError } = await supabase
    .from('sessions')
    .select('id, label')
    .eq('conversation_id', conversationId);

  if (sessError || !sessions?.length) {
    return res.status(404).json({ error: 'No sessions found for conversation' });
  }

  const sessionIds = sessions.map(s => s.id);
  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s.label]));
  const latestSessionId = sessionIds[sessionIds.length - 1];

  // 3. Entries by pagination
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, role, content, created_at, session_id')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (entriesError) {
    return res.status(500).json({ error: 'Failed to fetch entries' });
  }

  // 4. Closing trigger
  const { data: metadata, error: metaError } = await supabase
    .from('profile_metadata')
    .select('closing_trigger')
    .eq('profile', profile)
    .single();

  if (metaError || !metadata) {
    return res.status(500).json({ error: 'Failed to fetch profile metadata' });
  }

  // 5. Scroll anchors (from system_events)
  const { data: eventData, error: eventError } = await supabase
    .from('system_events')
    .select('session_id, note')
    .eq('event_type', 'session_first_entry')
    .in('session_id', sessionIds);

  if (eventError) {
    return res.status(500).json({ error: 'Failed to fetch system events' });
  }

  const scrollAnchors = (eventData || [])
    .map(ev => {
      const match = ev.note?.match(/Első bejegyzés ID: ([a-f0-9-]+)/);
      const entry_id = match?.[1];
      const label = sessionMap[ev.session_id] || '';
      if (!entry_id || !label) return null;
      return { entry_id, label };
    })
    .filter(Boolean);

  return res.status(200).json({
    conversationId,
    sessionId: latestSessionId,
    sessionIds,
    entries,
    closingTrigger: metadata.closing_trigger || '',
    scrollAnchors // 👈 ÚJ!
  });
}
