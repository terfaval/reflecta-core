// File: /pages/api/prompt.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';
import { prepareProfile } from '@/lib/prepareProfile';
import type { UserPreferences, SessionMeta } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { profileName, userId, preferences, sessionMeta } = req.body as {
    profileName: string;
    userId: string;
    preferences: UserPreferences;
    sessionMeta: SessionMeta;
  };

  if (!profileName || !userId) {
    return res.status(400).json({ error: 'Missing profileName or userId' });
  }

  // 🎭 Profil betöltése teljes struktúrával
  const profileObject = await prepareProfile(profileName);
  if (!profileObject) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // 🧠 Prompt generálása a profil, preferenciák és sessionMeta alapján
  const systemPrompt = buildSystemPrompt(profileObject, preferences, sessionMeta);

  // 🎯 Ajánlások lekérése (ha a frontendnek szüksége van rá)
  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('name, trigger, type, intensity, guidance_direction, style_keywords, target_mode')
    .eq('profile', profileName);

  return res.status(200).json({ systemPrompt, recommendations });
}
