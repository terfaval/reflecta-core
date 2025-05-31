// File: /pages/api/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, userId } = req.body;
  if (!name || !userId) {
    return res.status(400).json({ error: 'Missing profile name or userId' });
  }

  // Hozzáférés-ellenőrzés
  const { data: access } = await supabase
    .from('profile_access')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_name', name);

  if (!access || access.length === 0) {
    return res.status(403).json({ error: 'Access denied to this profile.' });
  }

  // Profil adatok lekérése
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, prompt_core, description, color, tone_instructions, style_profile, is_active')
    .eq('name', name)
    .maybeSingle();

  const { data: metadata, error: metaError } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', name)
    .maybeSingle();

  const { data: prompts, error: promptsError } = await supabase
    .from('profile_starting_prompts')
    .select('label, message')
    .eq('profile', name)
    .order('priority');

  if (profileError || metaError || promptsError) {
    return res.status(500).json({
      error: profileError?.message || metaError?.message || promptsError?.message
    });
  }

  if (!profile || !metadata) {
    return res.status(404).json({ error: 'Profile or metadata not found' });
  }

  res.status(200).json({
    ...profile,
    closing_trigger: metadata.closing_trigger,
    starting_prompts: prompts || []
  });
}
