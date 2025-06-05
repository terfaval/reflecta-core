// lib/saveUserPreferences.ts
import { createClient } from '@supabase/supabase-js';
import type { UserPreferences } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function saveUserPreferences(user_id: string, prefs: UserPreferences) {
  if (!user_id) return;

  if (Object.keys(prefs).length === 0) {
    // Reset esetén törlés
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user_id);

    if (error) {
      console.error('[Save Prefs - RESET] Hiba:', error);
    }
    return;
  }

  // Normál mentés
  const { error } = await supabase
    .from('user_preferences')
.upsert({
  user_id,
  answer_length: prefs.answer_length ?? null,
  style_mode: prefs.style_mode ?? null,
  guidance_mode: prefs.guidance_mode ?? null,
  tone_preference: prefs.tone_preference ?? null,
}, { onConflict: 'user_id' });


  if (error) {
    console.error('[Save Prefs] Hiba:', error);
  }
}

