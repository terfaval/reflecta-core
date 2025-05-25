// File: lib/matchRecommendations.ts

import { supabase } from '@/lib/supabase-admin';
import { evaluateTriggerCondition, EvaluationContext } from './evaluateTriggerCondition';

export async function matchRecommendations(
  profile: string,
  message: string,
  contextExtras?: Partial<EvaluationContext>
): Promise<string | null> {
  const { data: recs } = await supabase
    .from('recommendations')
    .select('name, trigger, can_lead, trigger_condition, intensity')
    .eq('profile', profile)
    .eq('can_lead', true);

  if (!recs) return null;

  const msg = message.toLowerCase();

  for (const rec of recs) {
    const hasCondition = rec.trigger_condition !== null;
    const baseMatch = rec.trigger && msg.includes(rec.trigger.toLowerCase());

    const context: EvaluationContext = {
      message: msg,
      entryLength: message.length,
      intensity: rec.intensity,
      ...contextExtras // ⬅️ további NLP vagy statisztikai input
    };

    if (hasCondition) {
      const condition = rec.trigger_condition;
      if (evaluateTriggerCondition(condition, context)) {
        return rec.name;
      }
    } else if (baseMatch) {
      return rec.name;
    }
  }

  return null;
}
