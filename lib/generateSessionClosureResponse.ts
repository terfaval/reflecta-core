// File: lib/generateSessionClosureResponse.ts

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

  const languageTonePrefix = [
    'Kérlek, magyar nyelven fogalmazz.',
    'Hangnemed legyen természetes, lágy, és a naplózás teréhez illeszkedő.',
    'Ne magyarázz, ne zárd le túl direkt módon – inkább csak tükrözd vissza a belső ívet.',
  ].join(' ');

  const formatHint = (() => {
    const style = metadata?.closing_style?.toLowerCase() || '';
    if (style.includes('pontszerű')) return 'Prefer bullet point structure with short reflective insights.';
    if (style.includes('képi')) return 'Use gentle, symbolic and metaphorical imagery to close the session.';
    return 'Use natural narrative to summarise in a few sentences.';
  })();

  const systemPrompt = `
${languageTonePrefix}

You are a Reflective Summary Assistant. Your task is to write a short, profile-style reflective closing message.
Reflect on the user's entries in a supportive and resonant style.
Adapt the tone based on the profile metadata. If the session was longer, you may use a structured format (like bullet points).
Do not summarize assistant replies, only user thoughts.

Style hint: ${metadata?.closing_style || 'összegző, támogató'}
${formatHint}
`;

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
  if (!closure || closure.length < 10)
    return 'Köszönöm, hogy itt voltál. A szakasz most lezárult.';

  return closure;
}
