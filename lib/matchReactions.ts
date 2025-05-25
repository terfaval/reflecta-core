// File: lib/matchReactions.ts

import { supabase } from '@/lib/supabase-admin';
import { evaluateTriggerCondition, EvaluationContext } from './evaluateTriggerCondition';

export async function matchReactions(
  profile: string,
  message: string,
  contextExtras?: Partial<EvaluationContext>
): Promise<string | null> {
  const { data: reactions } = await supabase
    .from('profile_reactions')
    .select('reaction, trigger_context, rarity, activation_condition')
    .eq('profile', profile)
    .eq('rarity', 'common');

  if (!reactions) return null;

  const msg = message.toLowerCase();

  for (const reaction of reactions) {
    const hasLogic = reaction.activation_condition !== null;
    const baseTriggers = reaction.trigger_context?.toLowerCase().split(/[,\s]+/) || [];
    const baseMatch = baseTriggers.some(t => msg.includes(t));

    const context: EvaluationContext = {
      message: msg,
      entryLength: message.length,
      ...contextExtras
    };

    if (hasLogic) {
      const condition = reaction.activation_condition;
      if (evaluateTriggerCondition(condition, context)) {
        return reaction.reaction;
      }
    } else if (baseMatch) {
      return reaction.reaction;
    }
  }

  return null;
}
