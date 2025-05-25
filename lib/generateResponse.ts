import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from './buildSystemPrompt';
import { OpenAI } from 'openai';
import { matchReactions } from '@/lib/matchReactions';
import { matchRecommendations } from '@/lib/matchRecommendations';
import { extractContext } from '@/lib/contextExtractor';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
 

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateResponse(sessionId: string): Promise<{
  reply: string;
  reaction_tag?: string;
  recommendation_tag?: string;
}> {
  const { data: session } = await supabase
    .from('sessions')
    .select('id, profile, user_id, conversation_id')
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

  const closingTrigger = metadata?.closing_trigger?.trim();

  const reactionTypes = ['common', 'typical', 'rare'] as const;
  const reactions: { [key in (typeof reactionTypes)[number]]: string[] } = {
    common: [],
    typical: [],
    rare: [],
  };

  for (const type of reactionTypes) {
    const { data } = await supabase
      .from('profile_reactions')
      .select('reaction')
      .eq('profile', session.profile)
      .eq('rarity', type);
    reactions[type] = data?.map((r) => r.reaction) || [];
  }

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('name, trigger')
    .eq('profile', session.profile);

  const { data: recentEntries } = await supabase
    .from('entries')
    .select('role, content, reaction_tag')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(30);

  const { data: highlightedEntries } = await supabase
    .from('entries')
    .select('role, content, reaction_tag')
    .eq('session_id', sessionId)
    .not('reaction_tag', 'is', null)
    .order('created_at', { ascending: true })
    .limit(10);

  const allEntriesMap = new Map<string, { role: string; content: string; reaction_tag?: string }>();
  [...(highlightedEntries || []), ...(recentEntries || [])].forEach(entry => {
    allEntriesMap.set(`${entry.role}-${entry.content}`, entry);
  });

  const entries = Array.from(allEntriesMap.values());

  const lastUserEntry = [...entries]
    .reverse()
    .find(e =>
      e.role === 'user' &&
      (!closingTrigger || e.content.trim() !== closingTrigger)
    );

  let sessionMeta = {};
  if (lastUserEntry) {
    const content = lastUserEntry.content.trim();
    sessionMeta = {
      isShortEntry: content.length < 50,
      isQuestion: content.endsWith('?'),
      isReflective: /érzem|gondolom|hiszem|talán|nem tudom/i.test(content),
    };
  }

  const systemPrompt = buildSystemPrompt(
    {
      name: profile.name,
      prompt_core: profile.prompt_core,
      description: profile.description,
      metadata,
      reactions,
    },
    undefined,
    sessionMeta
  );

  const messages: ChatCompletionMessageParam[] = [
  { role: 'system', content: systemPrompt },
  ...entries.map((e) => ({
    role: e.role as 'user' | 'assistant',
    content: e.content
  }))
];


  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
  });

  const reply = chat.choices[0].message.content;
  if (!reply) throw new Error('No reply generated');

  let reaction_tag = undefined;
  let recommendation_tag = undefined;

  if (lastUserEntry) {
    const content = lastUserEntry.content.trim();
    const context = extractContext(content);

    reaction_tag = await matchReactions(profile.name, content, context);
    recommendation_tag = await matchRecommendations(profile.name, content, context);
  }

  if (reaction_tag || recommendation_tag) {
    const events = [];
    if (reaction_tag) {
      events.push({
        session_id: sessionId,
        event_type: 'reaction_triggered',
        note: `Reakció aktiválódott: ${reaction_tag}`,
      });
    }
    if (recommendation_tag) {
      events.push({
        session_id: sessionId,
        event_type: 'recommendation_triggered',
        note: `Ajánlás aktiválódott: ${recommendation_tag}`,
      });
    }
    await supabase.from('system_events').insert(events);
  }

  return {
    reply,
    reaction_tag,
    recommendation_tag,
  };
}
