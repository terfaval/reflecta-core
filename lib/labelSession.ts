import supabase from '@/lib/supabase-admin';

export async function labelSession(sessionId: string): Promise<string> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('label')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session) {
    console.error('[labelSession] ❌ Session fetch error:', error?.message || 'Session not found');
    throw new Error('Nem sikerült betölteni a címkét');
  }

  if (!session.label || session.label.length < 2) {
    console.warn('[labelSession] ⚠️ Nincs mentett címke. Visszatér alapértelmezettre.');
    return 'Általános naplózás';
  }

  return session.label;
}
