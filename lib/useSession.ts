// File: /lib/useSession.ts

import supabase from '../../lib/supabase-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getOrCreateConversationAndSession(userId: string, profile: string) {
  // 1. Keresünk aktív conversation-t
  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('profile', profile)
    .eq('is_archived', false)
    .order('started_at', { ascending: false })
    .maybeSingle();

  let conversationId: string;

  if (conversation && !convErr) {
    conversationId = conversation.id;
  } else {
    // 2. Létrehozunk egy új conversation-t
    const { data: createdConv, error: createConvErr } = await supabase
      .from('conversations')
      .insert({ user_id: userId, profile })
      .select()
      .maybeSingle();

    if (createConvErr || !createdConv) throw new Error('Failed to create conversation.');
    conversationId = createdConv.id;
  }

  // 3. Nyitott session keresése az adott conversation-höz
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('ended_at', null)
    .maybeSingle();

  if (existingSession) return { conversationId, session: existingSession };

  // 4. Új session létrehozása
  const { data: newSession, error: sessionErr } = await supabase
    .from('sessions')
    .insert({ user_id: userId, profile, conversation_id: conversationId })
    .select()
    .maybeSingle();

  if (sessionErr || !newSession) throw new Error('Failed to create session.');
  return { conversationId, session: newSession };
}