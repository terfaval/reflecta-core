import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from './buildSystemPrompt';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateSessionClosureResponse(sessionId: string): Promise<string> {
  const { data: session } = await supabase
    .from('sessions')
    .select('id, profile')
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
    return 'Köszönöm a megosztásaidat. Ezzel a szakasz most lezárul.';

  // 👉 Build prompt using full logic and metadata
  const fullPrompt = buildSystemPrompt(
    {
      name: profile.name,
      prompt_core: profile.prompt_core,
      description: profile.description,
      metadata,
      reactions: {
        common: [],
        typical: [],
        rare: [],
      },
    },
    undefined,
    { isClosing: true } // 🔧 átadjuk, hogy zárásról van szó
  );

  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: fullPrompt },
    ...userEntries,
  ];

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.6,
    max_tokens: 400,
  });

  const closure = chat.choices[0].message.content?.trim();
  if (!closure || closure.length < 10)
    return 'Köszönöm, hogy itt voltál. A szakasz most lezárult.';

  return closure;
}
