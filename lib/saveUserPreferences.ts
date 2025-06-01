// lib/saveUserPreferences.ts
import { createClient } from '@supabase/supabase-js';
import type { UserPreferences } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function saveUserPreferences(user_id: string, prefs: UserPreferences) {
  if (!user_id) return;

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id, ...prefs }, { onConflict: 'user_id' });

  if (error) {
    console.error('[Save Prefs] Hiba:', error);
  }
}
