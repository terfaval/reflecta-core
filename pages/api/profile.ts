// File: /pages/api/profile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, userId } = req.body;
  if (!name || !userId) {
    return res.status(400).json({ error: 'Missing profile name or userId' });
  }

  // 🔒 Access control: only users in profile_access table can access if restricted
  const { data: restrictedList, error: accessError } = await supabase
    .from('profile_access')
    .select('user_id')
    .eq('profile_name', name);

  if (accessError) {
    return res.status(500).json({ error: 'Access check failed: ' + accessError.message });
  }

  if (restrictedList?.length > 0) {
    const allowedUserIds = restrictedList.map(row => row.user_id);
    if (!allowedUserIds.includes(userId)) {
      return res.status(403).json({ error: 'Access denied to this profile.' });
    }
  }

  // 📦 Profile base data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, prompt_core, color, is_active') // stripped: description, tone_instructions, style_profile
    .eq('name', name)
    .maybeSingle();

  // 🎨 Profile metadata
  const { data: metadata, error: metaError } = await supabase
    .from('profile_metadata')
    .select('closing_trigger')
    .eq('profile', name)
    .maybeSingle();

  // 💬 Starting prompts
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

  // ✅ Final response
  res.status(200).json({
    ...profile,
    closing_trigger: metadata.closing_trigger,
    starting_prompts: prompts || []
  });
}
