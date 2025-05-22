// pages/api/test-supabase.ts

import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase.from('users').select('id');
    if (error) throw error;

    return res.status(200).json({ status: 'ok', rows: data.length });
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}
