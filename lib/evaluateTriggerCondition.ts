// File: lib/evaluateTriggerCondition.ts

export type TriggerCondition =
  | { keyword: string }
  | { intensity: string }
  | { entryLength?: string }
  | { emotion_tag: string }
  | { keyword_count: Record<string, { gte: number }> }
  | { symbolic_language: boolean }
  | { abstract_density: { gte: number } }
  | { paradox_flag: boolean }
  | { session_silence: { gte: number } }
  | { numbness_mentions: { gte: number } }
  | { topic_loop: { within_sessions: boolean } }
  | { and: TriggerCondition[] }
  | { or: TriggerCondition[] }
  | Record<string, any>; // fallback

export interface EvaluationContext {
  message: string;
  entryLength?: number;
  intensity?: string;
  tags?: string[]; // emotion_tag, logical tags, etc.
  features?: Record<string, any>; // symbolic_language, abstract_density, etc.
  sessionStats?: Record<string, any>; // silenceSeconds, repeats, etc.
}

export function evaluateTriggerCondition(
  condition: TriggerCondition,
  context: EvaluationContext
): boolean {
  if ('keyword' in condition) {
    return context.message.toLowerCase().includes(condition.keyword.toLowerCase());
  }

  if ('intensity' in condition && context.intensity) {
    return condition.intensity === context.intensity;
  }

  if ('entryLength' in condition && typeof context.entryLength === 'number') {
    const match = condition.entryLength.match(/^([<>]=?|=)\s*(\d+)$/);
    if (!match) return false;
    const [, op, numStr] = match;
    const value = parseInt(numStr, 10);
    switch (op) {
      case '<': return context.entryLength < value;
      case '<=': return context.entryLength <= value;
      case '>': return context.entryLength > value;
      case '>=': return context.entryLength >= value;
      case '=': return context.entryLength === value;
      default: return false;
    }
  }

  if ('emotion_tag' in condition && Array.isArray(context.tags)) {
    return context.tags.includes(condition.emotion_tag);
  }

  if ('keyword_count' in condition) {
  for (const [word, rule] of Object.entries(condition.keyword_count as Record<string, { gte: number }>)) {
    const count = (context.message.match(new RegExp(word, 'gi')) || []).length;
    if (count < rule.gte) return false;
  }
  return true;
}

  if ('symbolic_language' in condition && context.features) {
    return context.features.symbolic_language === condition.symbolic_language;
  }

  if ('abstract_density' in condition && context.features?.abstract_density !== undefined) {
    return context.features.abstract_density >= condition.abstract_density.gte;
  }

  if ('paradox_flag' in condition && context.features) {
    return context.features.paradox_flag === condition.paradox_flag;
  }

  if ('session_silence' in condition && context.sessionStats?.silenceSeconds !== undefined) {
    return context.sessionStats.silenceSeconds >= condition.session_silence.gte;
  }

  if ('numbness_mentions' in condition && context.features?.numbness_mentions !== undefined) {
    return context.features.numbness_mentions >= condition.numbness_mentions.gte;
  }

  if ('topic_loop' in condition && context.sessionStats?.topic_loop !== undefined) {
    return context.sessionStats.topic_loop.within_sessions === condition.topic_loop.within_sessions;
  }

  if ('and' in condition) {
    return condition.and.every(sub => evaluateTriggerCondition(sub, context));
  }

  if ('or' in condition) {
    return condition.or.some(sub => evaluateTriggerCondition(sub, context));
  }

  // fallback: always false for unknown condition
  return false;
}
