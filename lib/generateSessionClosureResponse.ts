// File: lib/generateSessionClosureResponse.ts

import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from './buildSystemPrompt';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateSessionClosureResponse(sessionId: string): Promise<string> {
  // 1. Session és profiladatok lekérése
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

  if (!entries || entries.length < 3) return 'Köszönöm a megosztásaidat. Ezzel a szakasz most lezárul.';

  // 2. Prompt összeállítása
  const languageTonePrefix = [
    "Kérlek, magyar nyelven fogalmazz.",
    "Hangnemed legyen természetes, lágy, és a naplózás teréhez illeszkedő.",
    "Ne magyarázz, ne zárd le túl direkt módon – inkább csak tükrözd vissza a belső ívet."
  ].join(' ');

  const systemPrompt = `
${languageTonePrefix}

You are a Reflective Summary Assistant. Your task is to write a short, profile-style reflective closing message.
Reflect on the user's entries in a supportive and resonant style.
Adapt the tone based on the profile metadata. If the session was longer, you may use a structured format (like bullet points).
Do not summarize assistant replies, only user thoughts.

Style hint: ${metadata?.closing_style || 'összegző, támogató'}
`;

  const messages: ChatCompletionMessageParam[] = [
  { role: 'system', content: systemPrompt },
  ...entries
    .filter(e => e.role === 'user' || e.role === 'assistant')
    .map((e) => ({
      role: e.role as 'user' | 'assistant',
      content: e.content
    }))
];


  // 3. OpenAI hívás
  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.6,
    max_tokens: 400,
  });

  const closure = chat.choices[0].message.content?.trim();
  if (!closure || closure.length < 10) return 'Köszönöm, hogy itt voltál. A szakasz most lezárult.';
  return closure;
}
