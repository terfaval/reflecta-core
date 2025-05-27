import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrCreateConversationAndSession } from '@/lib/useSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, profile } = req.body;

  if (!userId || !profile) {
    return res.status(400).json({ error: 'Missing userId or profile' });
  }

  try {
    const { session } = await getOrCreateConversationAndSession(userId, profile);
    return res.status(200).json({ session });
  } catch (err: any) {
    console.error('[Reflecta] getOrCreateConversationAndSession error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

