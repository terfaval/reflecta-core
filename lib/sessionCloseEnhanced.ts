import supabase from '@/lib/supabase-admin';
import { labelSession } from './labelSession';
import { generateSessionClosureResponse } from './generateSessionClosureResponse';

export async function sessionCloseEnhanced(sessionId: string) {
  // 0. Ellenőrizzük, hogy már le van-e zárva
  const { data: sessionMeta, error: sessionErr } = await supabase
    .from('sessions')
    .select('ended_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionErr) {
    console.error('[sessionCloseEnhanced] ❌ Session fetch error:', sessionErr.message);
    throw new Error('Session lekérési hiba');
  }

  if (sessionMeta?.ended_at) {
    console.warn('[sessionCloseEnhanced] ⚠️ Session already closed. Skipping.');
    return { label: '[már lezárt]', closureEntry: '' };
  }

  // 1. Lekérjük az összes entry-t időrendben
  const { data: entries, error: entryError } = await supabase
    .from('entries')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (entryError || !entries?.length) throw new Error('Nincs elérhető bejegyzés a sessionhöz');

  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  // 2. Label generálása (OpenAI)
  const label = await labelSession(sessionId);

  // 3. System events: első és utolsó entry megjelölése
  await supabase.from('system_events').insert([
    {
      session_id: sessionId,
      event_type: 'session_first_entry',
      note: `Első bejegyzés ID: ${firstEntry.id}`,
    },
    {
      session_id: sessionId,
      event_type: 'session_last_entry',
      note: `Utolsó bejegyzés ID: ${lastEntry.id}`,
    },
  ]);

  // 4. Záróreflexió generálása
  const closureReply = await generateSessionClosureResponse(sessionId);

  // 5. Assistant válaszként mentés
  await supabase.from('entries').insert({
    session_id: sessionId,
    role: 'assistant',
    content: closureReply,
    created_at: new Date().toISOString(),
  });

  // 6. Label felirat (system-style entry)
  await supabase.from('entries').insert({
    session_id: sessionId,
    role: 'system',
    content: `Szakasz lezárása: ${label}`,
    created_at: new Date().toISOString(),
  });

  // 7. Session lezárása
  const { error: sessionUpdateError, data: updated } = await supabase
    .from('sessions')
    .update({
      closed_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select();

  if (sessionUpdateError || !updated?.length) {
    console.error('[sessionCloseEnhanced] ❌ Session update failed or empty result:', sessionUpdateError?.message);
    throw new Error('Session lezárása sikertelen');
  } else {
    console.log('[sessionCloseEnhanced] ✅ Session updated:', updated);
  }

  return { label, closureEntry: closureReply };
}
