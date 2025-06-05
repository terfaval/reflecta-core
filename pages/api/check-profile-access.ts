import supabase from '../../lib/supabase-admin';

export default async function handler(req, res) {
  const { userId, profile } = req.body;

  // 1. Lekérjük, hogy korlátozott-e ez a profil bárkinek is
  const { data: restrictedAccess, error } = await supabase
    .from('profile_access')
    .select('user_id')
    .eq('profile_name', profile);

  if (error) return res.status(500).json({ error: error.message });

  // 2. Ha a profil nincs korlátozva (nincs bejegyzés), mindenki elérheti
  if (!restrictedAccess || restrictedAccess.length === 0) {
    return res.status(200).json({ allowed: true });
  }

  // 3. Ha van bejegyzés → csak azok érhetik el, akiknek ott van a user_id
  const allowedUserIds = restrictedAccess.map(row => row.user_id);
  const isAllowed = allowedUserIds.includes(userId);

  return res.status(200).json({ allowed: isAllowed });
}
