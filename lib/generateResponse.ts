import supabase from '@/lib/supabase-admin';
import { buildSystemPrompt } from './buildSystemPrompt';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 🔍 Új: reakció- és ajánlásdetektáló segédfüggvények user input alapján

async function matchReactions(profile: string, message: string) {
  const { data: reactions } = await supabase
    .from('profile_reactions')
    .select('reaction, trigger_context, rarity')
    .eq('profile', profile)
    .eq('rarity', 'common');

  if (!reactions) return null;

  const msg = message.toLowerCase();
  for (const reaction of reactions) {
    const triggers = reaction.trigger_context?.toLowerCase().split(/[\s,]+/) || [];
    if (triggers.some(t => msg.includes(t))) return reaction.reaction;
  }

  return null;
}

async function matchRecommendations(profile: string, message: string) {
  const { data: recs } = await supabase
    .from('recommendations')
    .select('name, trigger, can_lead')
    .eq('profile', profile)
    .eq('can_lead', true);

  if (!recs) return null;

  const msg = message.toLowerCase();
  for (const rec of recs) {
    if (rec.trigger && msg.includes(rec.trigger.toLowerCase())) return rec.name;
  }

  return null;
}

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

  const { data: entries } = await supabase
    .from('entries')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  const lastUserEntry = [...(entries || [])].reverse().find((e) => e.role === 'user');
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

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(entries || []).map((e) => ({ role: e.role, content: e.content }))
  ];

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
  });

  const reply = chat.choices[0].message.content;
  if (!reply) throw new Error('No reply generated');

  // 🔄 Új: triggerelés USER input alapján
  let reaction_tag = undefined;
  let recommendation_tag = undefined;

  if (lastUserEntry) {
    reaction_tag = await matchReactions(profile.name, lastUserEntry.content);
    recommendation_tag = await matchRecommendations(profile.name, lastUserEntry.content);
  }

  // 🔔 System event naplózás, ha történt trigger
if (reaction_tag || recommendation_tag) {
  const events = [];

  if (reaction_tag) {
    events.push({
      session_id: sessionId,
      event_type: 'reaction_triggered',
      note: `Reakció aktiválódott: ${reaction_tag}`
    });
  }

  if (recommendation_tag) {
    events.push({
      session_id: sessionId,
      event_type: 'recommendation_triggered',
      note: `Ajánlás aktiválódott: ${recommendation_tag}`
    });
  }

  await supabase.from('system_events').insert(events);
}


  return {
    reply,
    reaction_tag,
    recommendation_tag
  };
}
