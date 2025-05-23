// File: /pages/api/prompt.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from '../../lib/buildSystemPrompt';

type UserPreferences = {
  answer_length?: 'short' | 'long';
  style_mode?: 'simple' | 'symbolic';
  guidance_mode?: 'free' | 'guided';
  tone_preference?: 'supportive' | 'confronting' | 'soothing';
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, prompt_core, description')
    .eq('name', profileName)
    .maybeSingle();

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { data: metadata } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', profileName)
    .maybeSingle();

  const { data: allReactions } = await supabase
    .from('profile_reactions')
    .select('rarity, reaction')
    .eq('profile', profileName);

  const reactionTypes = ['common', 'typical', 'rare'] as const;
  const reactions: { [key in (typeof reactionTypes)[number]]: string[] } = {
    common: [],
    typical: [],
    rare: [],
  };

  for (const type of reactionTypes) {
    reactions[type] = allReactions
      ?.filter((r) => r.rarity === type)
      .map((r) => r.reaction) || [];
  }

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('name, trigger, type, intensity, guidance_direction, style_keywords, target_mode')
    .eq('profile', profileName);

  const systemPrompt = buildSystemPrompt({
    name: profile.name,
    prompt_core: profile.prompt_core,
    description: profile.description,
    metadata,
    reactions,
  }, preferences, sessionMeta);

  return res.status(200).json({ systemPrompt, recommendations });
}
