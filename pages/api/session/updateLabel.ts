import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, label } = req.body;

  if (!sessionId || !label) {
    return res.status(400).json({ error: 'Missing sessionId or label' });
  }

  const { error } = await supabase
    .from('sessions')
    .update({ label })
    .eq('id', sessionId);

  if (error) {
    console.error('[updateLabel] error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
