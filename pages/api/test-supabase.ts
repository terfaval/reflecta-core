// File: pages/api/test-supabase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('[Reflecta DEBUG] Supabase error:', error); // 🔍 konzolra teljes hiba
      return res.status(500).json({ error: JSON.stringify(error) }); // 🪵 jól olvasható
    }

    return res.status(200).json({ status: 'ok', rows: data?.length || 0 });
  } catch (err) {
    console.error('[Reflecta DEBUG] Fetch crash:', err); // ha nem supabase error
    return res.status(500).json({ error: String(err) });
  }
}
