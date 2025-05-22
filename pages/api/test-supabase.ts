// pages/api/test-supabase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.error('[TEST] Supabase error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ status: 'ok', rows: data?.length ?? 0 });
}
