// File: /pages/api/session.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrCreateConversationAndSession } from '@/lib/useSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, profile } = req.body as {
    userId: string; // WordPress user ID
    profile: string;
  };

  if (!userId || !profile) {
    return res.status(400).json({ error: 'Missing userId or profile' });
  }

  try {
    const { conversationId, session } = await getOrCreateConversationAndSession(userId, profile);
    return res.status(200).json({ conversationId, session });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
