// File: /pages/api/prompt.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';

// Típusok újrahasználata (opcionálisan kiszervezheted később a /types mappába)
type UserPreferences = {
  answer_length?: 'short' | 'long';
  style_mode?: 'simple' | 'symbolic';
  guidance_mode?: 'free' | 'guided';
  tone_preference?: 'supportive' | 'confronting' | 'soothing';
};

type SessionMeta = {
  hasRecentSilence?: boolean;
  showsRepetition?: boolean;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // fontos: csak szerveroldalon használható!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { profileName, userPreferences, sessionMeta } = req.body as {
    profileName: string;
    userPreferences?: UserPreferences;
    sessionMeta?: SessionMeta;
  };

  // 1. Profil és metaadatok lekérése
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, prompt_core, description')
    .eq('name', profileName)
    .single();

  if (!profile || profileError) return res.status(404).json({ error: 'Profile not found' });

  const { data: metadata, error: metaError } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', profileName)
    .single();

  if (!metadata || metaError) return res.status(500).json({ error: 'Metadata missing' });

  // 2. Reakciók lekérése három szinten
  const reactionLevels = ['common', 'typical', 'rare'];
  const reactions: Record<string, string[]> = { common: [], typical: [], rare: [] };

  for (const level of reactionLevels) {
    const { data, error } = await supabase
      .from('profile_reactions')
      .select('description')
      .eq('profile', profileName)
      .eq('reaction_type', level);

    if (!error && data) reactions[level] = data.map((r) => r.description);
  }

  // 3. System prompt összeállítása
  const systemPrompt = buildSystemPrompt({
    name: profile.name,
    prompt_core: profile.prompt_core,
    description: profile.description,
    metadata,
    reactions,
  }, userPreferences, sessionMeta);

  return res.status(200).json({ systemPrompt });
}
