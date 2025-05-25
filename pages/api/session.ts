import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, profile } = req.body;

  if (!userId || !profile) {
    console.warn('[Reflecta] Hiányzó session paraméterek:', req.body);
    return res.status(400).json({ error: 'Missing userId or profile' });
  }

  try {
    // 1. Meglévő nyitott session keresése
    const { data: existing, error: findError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('profile', profile)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    if (existing && !existing.ended_at) {
      return res.status(200).json({ session: existing });
    }

    // 2. Conversation lekérése vagy létrehozása
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('profile', profile)
      .eq('is_archived', false)
      .maybeSingle();

    let conversationId = existingConv?.id;

    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert([{ user_id: userId, profile }])
        .select()
        .single();
      if (!newConv || !newConv.id) {
  throw new Error('Failed to create new conversation');
}
conversationId = newConv.id;

    }

    // 3. Új session létrehozása
    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert([{ user_id: userId, profile, conversation_id: conversationId }])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ session: data });
  } catch (err: any) {
    console.error('[Reflecta] session.ts hiba:', err.message || err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
