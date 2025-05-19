// File: /pages/api/respond.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateResponse } from '@/lib/generateResponse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionId } = req.body as { sessionId: string };
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    const reply = await generateResponse(sessionId);

    // Mentés az entries-be
    const { error } = await supabase.from('entries').insert({
      session_id: sessionId,
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ reply });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}