import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, names } = req.body as { userId?: string; names?: string[] };
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (userError) return res.status(500).json({ error: userError.message });

  const { data: personalRow } = await supabase
    .from('user_profiles')
    .select('profile_name')
    .eq('user_id', userId)
    .maybeSingle();

  const profileNames = names || [];
  if (personalRow?.profile_name) profileNames.push(personalRow.profile_name);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('name, description, color')
    .in('name', profileNames);

  if (profilesError) return res.status(500).json({ error: profilesError.message });

  res.status(200).json({
    profiles,
    personalProfile: personalRow?.profile_name || null,
    role: user?.role || 'basic',
  });
}