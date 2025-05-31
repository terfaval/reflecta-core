import supabase from '@/lib/supabase-admin';
import { getCachedSystemPrompt } from './cachedPrompt';
import { logTokenUsage } from './logTokenUsage';
import { OpenAI } from 'openai';
import type { Profile } from './types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateSessionClosureResponse(sessionId: string): Promise<string> {
  const { data: session } = await supabase
    .from('sessions')
    .select('id, profile, user_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) throw new Error('Session not found');

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

  const { data: entries } = await supabase
    .from('entries')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  const userEntries = entries
    ?.filter((e) => e.role === 'user')
    .map((e) => ({ role: 'user' as const, content: e.content })) || [];

  if (userEntries.length < 2)
    return 'Köszönöm a megosztásaidat. Mint egy csendes sóhaj a térben, ez a szakasz most lezárul.';

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user_id)
    .maybeSingle();

  const { data: reactionsRaw } = await supabase
    .from('profile_reactions')
    .select('reaction, rarity')
    .eq('profile', session.profile);

  const reactions = {
    common: [] as string[],
    typical: [] as string[],
    rare: [] as string[],
  };

  for (const r of reactionsRaw || []) {
    if (r.rarity in reactions) {
      reactions[r.rarity].push(r.reaction);
    }
  }

  const profileObject: Profile = {
    name: profile.name,
    prompt_core: profile.prompt_core,
    description: profile.description,
    metadata,
    reactions,
  };

  const languageTonePrefix = [
    "Kérlek, minden válaszodat magyar nyelven írd.",
    "Beszélj finoman, természetes ritmusban, ne legyél túl gépies.",
    "Használj tiszteletteljes, de tegező hangnemet, ahogyan egy érzékeny önreflexiós naplóasszisztens tenné."
  ].join(' ');

  const fullPrompt = getCachedSystemPrompt(
    profileObject,
    prefs || undefined,
    { isClosing: true }
  );

  const systemPrompt = `${languageTonePrefix}\n\n${fullPrompt}`;

  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...userEntries,
  ];

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.6,
    max_tokens: 400,
  });

  const closure = chat.choices[0].message.content?.trim();

  if (chat.usage) {
    logTokenUsage({
      sessionId,
      model: chat.model || 'gpt-3.5-turbo',
      promptTokens: chat.usage.prompt_tokens,
      completionTokens: chat.usage.completion_tokens,
    });
  }

  if (!closure || closure.length < 10)
    return 'Köszönöm, hogy itt voltál. Ez a találkozás most lecsendesül.';

  return closure;
}
