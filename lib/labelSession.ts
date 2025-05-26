import supabase from '@/lib/supabase-admin';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function labelSession(sessionId: string): Promise<string> {
  const { data: entries } = await supabase
    .from('entries')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(40); // nagyobb minta

  const userMessages = entries
    ?.filter((e) => e.role === 'user')
    .map((e) => ({
      role: 'user' as const,
      content: e.content,
    })) || [];

  if (userMessages.length < 2) return 'Általános naplózás';

  const messages: { role: 'system' | 'user'; content: string }[] = [
    {
      role: 'system',
      content: `You are a helpful assistant that summarizes self-reflection sessions in 1–4 words.
Return a compact and intuitive label for the emotional or thematic content of the conversation.
Respond with a short phrase in Hungarian. Do not explain.`,
    },
    ...userMessages,
  ];

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.5,
    max_tokens: 20,
  });

  const label = chat.choices[0].message.content?.trim();
  if (!label || label.length < 2) throw new Error('No meaningful label generated');

  await supabase
    .from('sessions')
    .update({ label, label_confidence: 0.9 })
    .eq('id', sessionId);

  console.log('[Reflecta] Label generated (HU) for session', sessionId, ':', label);

  return label;
}
