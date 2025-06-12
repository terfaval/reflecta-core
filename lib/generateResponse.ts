import supabase from '@/lib/supabase-admin';
import { getCachedSystemPrompt } from './cachedPrompt';
import { logTokenUsage } from './logTokenUsage';
import { OpenAI } from 'openai';
import { matchReactions } from '@/lib/matchReactions';
import { matchRecommendations } from '@/lib/matchRecommendations';
import { extractContext } from '@/lib/contextExtractor';
import { prepareProfile } from './prepareProfile';
import { deriveSessionMeta } from './deriveSessionMeta';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Profile, SessionMeta } from './types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// SESSION SEARCH OR CREATION

export async function generateResponse(sessionId: string): Promise<{
  reply: string;
  reaction_tag?: string;
  recommendation_tag?: string;
  warning?: string;
}> {
  const { data: session } = await supabase
    .from('sessions')
    .select('id, profile, user_id, conversation_id, ended_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) throw new Error('Session not found');

  // PROFILE LOADING

  const profileObject = await prepareProfile(session.profile);
  const closingTrigger = profileObject.metadata.closing_trigger?.trim();

  // 🔄 Adatok betöltése
const { data: recentEntries } = await supabase
  .from('entries')
  .select('role, content, reaction_tag, created_at')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: true })
  .limit(30);

const { data: highlightedEntries } = await supabase
  .from('entries')
  .select('role, content, reaction_tag, created_at')
  .eq('session_id', sessionId)
  .not('reaction_tag', 'is', null)
  .order('created_at', { ascending: true })
  .limit(10);

// 🧠 Map kulcsként role + content (de a highlight előzze meg!)
const entriesMap = new Map<string, { role: string; content: string; reaction_tag?: string }>();

// 🟡 Először a highlight-okat rakjuk be, hogy azok reaction_tag-je megmaradjon
(highlightedEntries || []).forEach(entry => {
  const key = `${entry.role}-${entry.content}`;
  entriesMap.set(key, entry);
});

// 🔵 Majd hozzáadjuk a többi elemet, ha még nincs ilyen kulcs
(recentEntries || []).forEach(entry => {
  const key = `${entry.role}-${entry.content}`;
  if (!entriesMap.has(key)) {
    entriesMap.set(key, entry);
  }
});

// ✅ Ebből lesz a végső, sorrendben használt lista
const entries = Array.from(entriesMap.values());
const lastEntry = entries[entries.length - 1];

  // 🔚 Manuális lezárás ellenőrzése
if (
  closingTrigger &&
  lastEntry?.role === 'user' &&
  lastEntry.content.trim() === closingTrigger &&
  !session.ended_at
) {
  return {
    reply: '',
    reaction_tag: undefined,
    recommendation_tag: undefined,
    warning: 'Session closure detected — please call /api/session/close to complete.'
  };
}

// 🔎 Utolsó érvényes user üzenet keresése (nem closingTrigger)
const lastUserEntry = [...entries]
  .reverse()
  .find(e => e.role === 'user' && e.content.trim() !== closingTrigger);

// 🧾 SessionMeta származtatása a user üzenet alapján
const sessionMeta = deriveSessionMeta(entries, closingTrigger);

// 🔒 Avoidance logic active check
const patterns = profileObject.metadata?.avoidance_logic ?? [];

if (Array.isArray(patterns) && lastUserEntry?.content) {
  const matches = patterns.some((patternStr) => {
    try {
      const regex = new RegExp(patternStr, 'i');
      return regex.test(lastUserEntry.content);
    } catch (err) {
      console.warn(`⚠️ Invalid avoidance_logic pattern: "${patternStr}"`, err);
      return false;
    }
  });

  if (matches) {
    return {
      reply: `Ez a téma úgy tűnik, kívül esik azon a térségen, ahol igazán hitelesen tudlak kísérni. Talán válthatnánk irányt, vagy hagyhatunk egy kis csendet, ha most arra van szükséged.`,
      reaction_tag: undefined,
      recommendation_tag: undefined,
    };
  }
}

  const languageTonePrefix = [
    "Minden válaszodat magyar nyelven add.",
    "Fogalmazz természetes ritmusban, finoman, mellőzve a gépies hangzást.",
    "Tartsd meg a tiszteletteljes, de tegező hangnemet — úgy, ahogy egy érzékeny önreflexiós naplóasszisztens szólna hozzád.",
    "Ügyelj a helyesírásra, nyelvtani pontosságra és gördülékeny stílusra."
  ].join(' ');

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user_id)
    .maybeSingle();

  const fullPrompt = getCachedSystemPrompt(
    profileObject,
    prefs || undefined,
    { isClosing: true }
  );

  const systemPrompt = `${languageTonePrefix}\n\n${fullPrompt}`;

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

  if (chat.usage) {
    logTokenUsage({
      sessionId,
      model: chat.model || 'gpt-3.5-turbo',
      promptTokens: chat.usage.prompt_tokens,
      completionTokens: chat.usage.completion_tokens,
    });
  }

  // let reaction_tag = undefined;
// let recommendation_tag = undefined;
//
// if (lastUserEntry) {
//   const content = lastUserEntry.content.trim();
//   const context = extractContext(content);
//
//   reaction_tag = await matchReactions(profileObject.name, content, context);
//   recommendation_tag = await matchRecommendations(profileObject.name, content, context);
// }

//  if (reaction_tag || recommendation_tag) {
//    const events = [];
//    if (reaction_tag) {
//      events.push({
//        session_id: sessionId,
//        event_type: 'reaction_triggered',
//        note: `Reakció aktiválódott: ${reaction_tag}`,
//      });
//    }
//    if (recommendation_tag) {
//      events.push({
//        session_id: sessionId,
//        event_type: 'recommendation_triggered',
//        note: `Ajánlás aktiválódott: ${recommendation_tag}`,
//      });
//    }
//    await supabase.from('system_events').insert(events);
//  }

  return {
    reply,
    reaction_tag: undefined,
    recommendation_tag: undefined,
};

