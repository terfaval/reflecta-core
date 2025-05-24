// File: /pages/api/profile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = req.query.name;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({ error: 'Missing profile name' });
  }

  const name = decodeURIComponent(raw);

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

  if (profileError || metaError) {
    return res.status(500).json({ error: profileError?.message || metaError?.message });
  }

  if (!profile || !metadata) {
    return res.status(404).json({ error: 'Profile or metadata not found' });
  }

  res.status(200).json({ 
  ...profile,
  closing_trigger: metadata.closing_trigger // 🔥 ez kell nekünk!
});

}
