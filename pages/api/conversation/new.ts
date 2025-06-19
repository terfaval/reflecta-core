import type { NextApiRequest, NextApiResponse } from 'next';
import { createConversationAndSession } from '@/lib/useSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, profile_name } = req.body as { user_id?: string; profile_name?: string };

  if (!user_id || !profile_name) {
    return res.status(400).json({ error: 'Missing user_id or profile_name' });
  }

  try {
    const { conversationId, session } = await createConversationAndSession(user_id, profile_name);
    return res.status(200).json({ conversation_id: conversationId, session_id: session.id });
  } catch (err: any) {
    console.error('[Reflecta] createConversationAndSession error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}