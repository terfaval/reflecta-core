// File: pages/api/session/close.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  try {
    const { error } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Reflecta] session/close hiba:', err.message || err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
