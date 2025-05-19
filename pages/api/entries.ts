// File: /pages/api/entries.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';
import { labelSession } from '../../lib/labelSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entries: data });
  }

  if (req.method === 'POST') {
    const { sessionId, entry } = req.body as {
      sessionId: string;
      entry: {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        created_at: string;
      };
    };

    if (!sessionId || !entry) return res.status(400).json({ error: 'Missing data' });

    // Profil-specifikus closing_trigger lekérdezése
    const sessionInfo = await supabase
      .from('sessions')
      .select('profile')
      .eq('id', sessionId)
      .maybeSingle();

    const profileName = sessionInfo.data?.profile;
    let trigger = '';

    if (profileName) {
      const meta = await supabase
        .from('profile_metadata')
        .select('closing_trigger')
        .eq('profile', profileName)
        .maybeSingle();

      trigger = meta.data?.closing_trigger || '';
    }

    // 1. entry mentése
    const { error } = await supabase.from('entries').insert({
      session_id: sessionId,
      role: entry.role,
      content: entry.content,
      created_at: entry.created_at,
    });

    if (error) return res.status(500).json({ error: error.message });

    // 2. ha closing_trigger → session lezárása + label generálás
    if (entry.content === trigger) {
      await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      try {
        await labelSession(sessionId);
      } catch (e) {
        console.warn('Labeling failed:', e);
      }
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
