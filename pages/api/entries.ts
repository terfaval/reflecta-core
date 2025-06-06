// File: /pages/api/entries.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';
import { sessionCloseEnhanced } from '@/lib/sessionCloseEnhanced';

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
        reaction_tag?: string;
        recommendation_tag?: string;
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

    // 1. entry mentése (reaction_tag + recommendation_tag támogatással)
    const { error } = await supabase.from('entries').insert({
      session_id: sessionId,
      role: entry.role,
      content: entry.content,
      created_at: entry.created_at,
      reaction_tag: entry.reaction_tag || null,
      recommendation_tag: entry.recommendation_tag || null,
    });

    if (error) return res.status(500).json({ error: error.message });

    // 2. system_events rögzítése reaction és recommendation esetén
    const events = [];

    if (entry.reaction_tag) {
      events.push({
        session_id: sessionId,
        event_type: 'reaction_triggered',
        note: `Reaction: ${entry.reaction_tag}`
      });
    }

    if (entry.recommendation_tag) {
      events.push({
        session_id: sessionId,
        event_type: 'recommendation_triggered',
        note: `Recommendation: ${entry.recommendation_tag}`
      });
    }

    if (events.length) {
      await supabase.from('system_events').insert(events);
    }

    


    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
