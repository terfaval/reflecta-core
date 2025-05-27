import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionCloseEnhanced } from '@/lib/sessionCloseEnhanced';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionId } = req.body as { sessionId: string };
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    const result = await sessionCloseEnhanced(sessionId);

    if (result.label === '[már lezárt]') {
      return res.status(409).json({ error: 'Session already closed.' });
    }

    return res.status(200).json({
      closureEntry: result.closureEntry,
      label: result.label,
    });
  } catch (err: any) {
    console.error('[Reflecta] sessionCloseEnhanced hiba:', err.message || err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
