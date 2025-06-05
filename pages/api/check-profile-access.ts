import supabase from '../../lib/supabase-admin';

export default async function handler(req, res) {
  const { userId: wp_user_id, profile } = req.body;

  try {
    // 1. Supabase user azonosító lekérése a wp_user_id alapján
    const { data: userMatch, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wp_user_id', wp_user_id)
      .single();

    if (userError || !userMatch) {
      throw new Error('Felhasználó nem található (wp_user_id: ' + wp_user_id + ')');
    }

    const supabaseUserId = userMatch.id;

    // 2. Lekérjük, hogy a profil korlátozott-e
    const { data: restrictedList, error } = await supabase
      .from('profile_access')
      .select('user_id')
      .eq('profile_name', profile);

    if (error) throw new Error(error.message);

    // 3. Ha nincs korlátozás erre a profilra, akkor szabad
    if (!restrictedList || restrictedList.length === 0) {
      return res.status(200).json({ allowed: true });
    }

    // 4. Csak azok érhetik el, akik szerepelnek a korlátozott listában
    const allowedUserIds = restrictedList.map(row => row.user_id);
    const isAllowed = allowedUserIds.includes(supabaseUserId);

    return res.status(200).json({ allowed: isAllowed });
  } catch (err) {
    console.error('[check-profile-access]', err.message);
    return res.status(500).json({ error: '[check-profile-access] ' + err.message });
  }
}
