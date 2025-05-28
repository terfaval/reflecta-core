// File: /pages/api/session/updateLabel.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entryId, label } = req.body;

  if (!entryId || !label) {
    return res.status(400).json({ error: 'Missing entryId or label' });
  }

  // Entry alapján lekérjük a session ID-t
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('session_id')
    .eq('id', entryId)
    .maybeSingle();

  if (entryError || !entry?.session_id) {
    return res.status(404).json({ error: 'Entry not found or session_id missing' });
  }

  // A session label frissítése
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ label })
    .eq('id', entry.session_id);

  if (updateError) {
    console.error('[updateLabel] error:', updateError.message);
    return res.status(500).json({ error: updateError.message });
  }

  return res.status(200).json({ success: true });
}
