// File: /pages/api/prompt.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '../../lib/buildSystemPrompt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Típusok újrahasználata (opcionálisan kiszervezheted később a /types mappába)
type UserPreferences = {
  answer_length?: 'short' | 'long';
  style?: 'simple' | 'symbolic';
  guidance?: 'free' | 'guided';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { profileName, userId, preferences, sessionMeta } = req.body as {
    profileName: string;
    userId: string;
    preferences: UserPreferences;
    sessionMeta: Record<string, any>;
  };

  if (!profileName || !userId) {
    return res.status(400).json({ error: 'Missing profileName or userId' });
  }

  // 1. Lekérjük a profil alapadatait
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, prompt_core, description')
    .eq('name', profileName)
    .maybeSingle();

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // 2. Lekérjük a metadata-t
  const { data: metadata } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', profileName)
    .maybeSingle();

  // 3. Lekérjük az összes reakciót
  const { data: allReactions } = await supabase
    .from('profile_reactions')
    .select('reaction_type, description')
    .eq('profile', profileName);

  // 4. Reakciók strukturálása
  const reactionTypes = ['common', 'typical', 'rare'] as const;
  const reactions: { [key in (typeof reactionTypes)[number]]: string[] } = {
    common: [],
    typical: [],
    rare: [],
  };

  for (const type of reactionTypes) {
    reactions[type] = allReactions
      ?.filter((r) => r.reaction_type === type)
      .map((r) => r.description) || [];
  }

  // 5. System prompt generálása
  const systemPrompt = buildSystemPrompt({
    name: profile.name,
    prompt_core: profile.prompt_core,
    description: profile.description,
    metadata,
    reactions,
  }, preferences, sessionMeta);

  return res.status(200).json({ systemPrompt });
}
