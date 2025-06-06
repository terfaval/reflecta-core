import supabase from '@/lib/supabase-admin';
import { labelSession } from './labelSession';
import { generateSessionClosureResponse } from './generateSessionClosureResponse';

export async function sessionCloseEnhanced(sessionId: string) {
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

  const { data: entries, error: entryError } = await supabase
    .from('entries')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (entryError || !entries?.length) throw new Error('Nincs elérhető bejegyzés a sessionhöz');

  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  const label = await labelSession(sessionId);
  if (!label || label.length < 2) {
    console.error('[sessionCloseEnhanced] ❌ Label is too short or undefined');
    throw new Error('Nem sikerült megfelelő címkét generálni');
  }

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

  const closureReply = await generateSessionClosureResponse(sessionId);
  if (!closureReply || closureReply.trim().length < 8) {
    console.error('[sessionCloseEnhanced] ❌ Closure reply is empty or too short');
    throw new Error('A lezáró válasz nem megfelelő');
  }

  const { data: session } = await supabase
    .from('sessions')
    .select('profile')
    .eq('id', sessionId)
    .maybeSingle();

  const { data: metadata } = await supabase
    .from('profile_metadata')
    .select('closing_trigger')
    .eq('profile', session.profile)
    .maybeSingle();

  const closingTrigger = metadata?.closing_trigger?.trim() || '';
  const now = new Date().toISOString();

  const { error: entryInsertErr } = await supabase.from('entries').insert([
    {
      session_id: sessionId,
      role: 'user',
      content: closingTrigger,
      created_at: now,
    },
    {
      session_id: sessionId,
      role: 'assistant',
      content: closureReply,
      created_at: now,
    },
    {
      session_id: sessionId,
      role: 'system',
      content: `Szakasz lezárása: ${label}`,
      created_at: now,
    },
  ]);

  if (entryInsertErr) {
    console.error('[sessionCloseEnhanced] ❌ Entry insert error:', {
      message: entryInsertErr.message,
      details: entryInsertErr.details,
      hint: entryInsertErr.hint,
      code: entryInsertErr.code,
    });

    throw new Error('Nem sikerült a záró bejegyzések mentése');
  }

  const { error: sessionUpdateError, data: updated } = await supabase
    .from('sessions')
    .update({
      ended_at: now,
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
  }

  console.log('[sessionCloseEnhanced] ✅ Session closed:', updated[0].id);

  return { label, closureEntry: closureReply };
}
