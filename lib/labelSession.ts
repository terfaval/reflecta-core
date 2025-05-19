// File: /lib/labelSession.ts

import supabase from '../lib/supabase-admin';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function labelSession(sessionId: string): Promise<string> {
  // Lekérjük a session entry-it (maximum 25)
  const { data: entries } = await supabase
    .from('entries')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(25);

  if (!entries || entries.length < 2) return 'Általános naplózás';

  const messages = [
    {
      role: 'system',
      content: `You are a helpful assistant that summarizes self-reflection sessions in 1–4 words.
Return a compact and intuitive label for the emotional or thematic content of the conversation.
Do not explain. Just return the label as a short phrase.`
    },
    ...entries.map((e) => ({ role: e.role, content: e.content }))
  ];

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.5,
    max_tokens: 20
  });

  const label = chat.choices[0].message.content?.trim();
  if (!label) throw new Error('No label generated');

  await supabase
    .from('sessions')
    .update({ label, label_confidence: 0.9 })
    .eq('id', sessionId);

  return label;
}
