// File: lib/sessionCloseEnhanced.ts

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

  // 1. Entry-k lekérése időrendben
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

  // 3. System events: első és utolsó entry rögzítése
  const { error: eventsErr } = await supabase.from('system_events').insert([
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
  if (eventsErr) {
    console.error('[sessionCloseEnhanced] ⚠️ System events insert error:', eventsErr.message);
  }

  // 4. Záróreflexió generálása
  const closureReply = await generateSessionClosureResponse(sessionId);

  // 5–6. Assistant + System entries mentése
  const { error: entryInsertErr } = await supabase.from('entries').insert([
    {
      session_id: sessionId,
      role: 'assistant',
      content: closureReply,
      created_at: new Date().toISOString(),
    },
    {
      session_id: sessionId,
      role: 'system',
      content: `Szakasz lezárása: ${label}`,
      created_at: new Date().toISOString(),
    },
  ]);
  if (entryInsertErr) {
    console.error('[sessionCloseEnhanced] ❌ Entry insert error:', entryInsertErr.message);
    throw new Error('Nem sikerült a záró bejegyzések mentése');
  }

  // 7. Session lezárása
  const { error: sessionUpdateError, data: updated } = await supabase
    .from('sessions')
    .update({
      closed_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      label,
      label_confidence: 0.9,
    })
    .eq('id', sessionId)
    .select();

  if (sessionUpdateError) {
    console.error('[sessionCloseEnhanced] ❌ Session update failed:', sessionUpdateError.message);
    throw new Error('Session lezárása sikertelen');
  }
  if (!updated || updated.length === 0) {
    console.error('[sessionCloseEnhanced] ❌ Session update returned empty result set.');
    throw new Error('Session lezárása nem hozott eredményt');
  } else {
    console.log('[sessionCloseEnhanced] ✅ Session updated:', updated);
  }

  return { label, closureEntry: closureReply };
}
