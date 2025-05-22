import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from './buildSystemPrompt';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateResponse(sessionId: string): Promise<string> {
  // 1. Lekérjük a session-hoz tartozó adatokat
  const { data: session } = await supabase
    .from('sessions')
    .select('id, profile, user_id, conversation_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) throw new Error('Session not found');

  // 2. Lekérjük a profil összes adatát
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, prompt_core, description')
    .eq('name', session.profile)
    .maybeSingle();

  const { data: metadata } = await supabase
    .from('profile_metadata')
    .select('*')
    .eq('profile', session.profile)
    .maybeSingle();

  const reactionTypes = ['common', 'typical', 'rare'] as const;
  const reactions: { [key in (typeof reactionTypes)[number]]: string[] } = {
    common: [],
    typical: [],
    rare: [],
  };

  for (const type of reactionTypes) {
    const { data } = await supabase
      .from('profile_reactions')
      .select('description')
      .eq('profile', session.profile)
      .eq('reaction_type', type);

    reactions[type] = data?.map((r) => r.description) || [];
  }

  // 3. Lekérjük az eddigi entries-t (max 20)
  const { data: entries } = await supabase
    .from('entries')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  // 🔍 4. Dinamikus sessionMeta meghatározás (az utolsó user entry alapján)
  const lastUserEntry = [...(entries || [])]
    .reverse()
    .find((e) => e.role === 'user');

  let sessionMeta = {};

  if (lastUserEntry) {
    const content = lastUserEntry.content.trim();
    const isShort = content.length < 50;
    const isQuestion = content.endsWith('?');
    const isReflective = /érzem|gondolom|hiszem|talán|nem tudom/i.test(content);

    sessionMeta = {
      isShortEntry: isShort,
      isQuestion,
      isReflective,
    };
  }

  // 5. System prompt generálása
  const systemPrompt = buildSystemPrompt(
    {
      name: profile.name,
      prompt_core: profile.prompt_core,
      description: profile.description,
      metadata,
      reactions,
    },
    undefined, // nincsenek user preferences
    sessionMeta
  );

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(entries || []).map((e) => ({ role: e.role, content: e.content }))
  ];

  // 6. OpenAI hívás
  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
  });

  const reply = chat.choices[0].message.content;
  if (!reply) throw new Error('No reply generated');

  return reply;
}
