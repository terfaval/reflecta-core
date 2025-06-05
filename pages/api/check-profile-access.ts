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

// 💡 ÚJ LOGIKA: ha nincs semmilyen bejegyzés erre a userre, akkor elérhet minden profilt
if (data.length === 0) {
  const { count, error: countError } = await supabase
    .from('profile_access')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) return res.status(500).json({ error: countError.message });

  if (count === 0) {
    return res.status(200).json({ allowed: true }); // nincs korlátozás
  }

  return res.status(200).json({ allowed: false }); // van korlátozás, de ez a profil nem elérhető
}

return res.status(200).json({ allowed: true });
