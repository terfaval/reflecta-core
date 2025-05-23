// File: /pages/api/respond.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateResponse } from '../../lib/generateResponse';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionId } = req.body as { sessionId: string };
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    const { reply, reaction_tag, recommendation_tag } = await generateResponse(sessionId);

    // Mentés az entries-be, extra mezőkkel
    const { error } = await supabase.from('entries').insert({
      session_id: sessionId,
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
      reaction_tag: reaction_tag || null,
      recommendation_tag: recommendation_tag || null,
    });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ content: reply });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
