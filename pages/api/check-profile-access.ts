// pages/api/check-profile-access.ts

import supabase from '../../lib/supabase-admin';

export default async function handler(req, res) {
  const { userId, profile } = req.body;

  const { data, error } = await supabase
    .from('profile_access')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_name', profile);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ allowed: data.length > 0 });
}
