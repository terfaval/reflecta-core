import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, name, answers } = req.body as { user_id?: string; name?: string; answers?: string[] };

  if (!user_id || !name || !Array.isArray(answers) || answers.length !== 5) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Placeholder implementation: store answers for later processing
  await supabase.from('profile_surveys').insert({ user_id, name, answers });

  res.status(200).json({ name });
}