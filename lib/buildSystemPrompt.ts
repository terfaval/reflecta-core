import type { Profile, UserPreferences, SessionMeta, StyleProfile } from './types';

export function buildSystemPrompt(
  profile: Profile,
  userPreferences?: UserPreferences,
  sessionMeta?: SessionMeta
): string {
  const lines: string[] = [];

  // 👤 IDENTITY
  lines.push(`# IDENTITY`);
  if (profile.prompt_core?.trim()) {
    lines.push(profile.prompt_core.trim(), '');
  }

  lines.push(`You focus on ${profile.focus}, and you speak in a ${profile.language_tone} manner.`);
  lines.push(`You are motivated by ${profile.inner_motivation}, and avoid: ${profile.sensitivity_boundary}.`);
  lines.push(`This profile operates in the domain of ${profile.metadata.domain}, guided by a ${profile.metadata.worldview} perspective.`);

  if (profile.metadata.inspirations?.length) {
    lines.push(`You are inspired by: ${profile.metadata.inspirations.join(', ')}.`);
  }
  if (profile.metadata.not_suitable_for?.length) {
    lines.push(`Avoid activation for: ${profile.metadata.not_suitable_for.join(', ')}.`);
  }
  if (profile.metadata.avoidance_logic) {
    lines.push(`Avoid activation when: ${profile.metadata.avoidance_logic}.`);
    lines.push(`If user's input matches your avoidance logic, gently indicate that the topic may fall outside your suitable range, and propose a soft redirection.`);
  }
  if (profile.metadata.preferred_context?.length) {
    lines.push(`You are particularly effective in contexts like: ${profile.metadata.preferred_context.join(', ')}.`);
  }

  // ✨ STYLE & STRUCTURE
  lines.push('\n# STYLE & STRUCTURE');

  const style: StyleProfile = {
    ...(profile.metadata.style_options ?? {}),
    ...((profile as any).style_profile ?? {})
  };

  if (style.style_tone)
    lines.push(`Your style should be ${style.style_tone}.`);
  if (style.style_symbol_density && style.style_rhythm)
    lines.push(`Use ${style.style_symbol_density} symbolic imagery in a ${style.style_rhythm} rhythm.`);
  if (style.style_structure)
    lines.push(`Structure your replies in a ${style.style_structure} manner.`);
  if (style.style_sentence_length)
    lines.push(`Use ${style.style_sentence_length} sentence lengths.`);
  if (style.style_visuality)
    lines.push(`Your visuality level should be ${style.style_visuality}.`);
  if (style.style_directiveness)
    lines.push(`Use a ${style.style_directiveness} guiding approach.`);
  if (style.style_pace)
    lines.push(`Maintain a ${style.style_pace} interaction pace.`);
  if (style.style_absorption_style)
    lines.push(`Favor ${style.style_absorption_style} absorption.`);
  if (style.style_humor && style.style_humor !== 'none')
    lines.push(`Humor may be used in a ${style.style_humor} way.`);

  if (profile.metadata.interaction_rhythm)
    lines.push(`Your interaction rhythm should follow: ${profile.metadata.interaction_rhythm}.`);

  // 🧠 CONTENT & QUESTIONING
  lines.push('\n# RESPONSE STRATEGY');

  if (profile.metadata.response_focus)
    lines.push(`Focus your responses on: ${profile.metadata.response_focus}.`);
  if (profile.metadata.primary_metaphors?.length)
    lines.push(`Draw from metaphors such as: ${profile.metadata.primary_metaphors.join(', ')}.`);
  if (profile.metadata.question_archetypes?.length)
    lines.push(`Frame your questions in the style of: ${profile.metadata.question_archetypes.join(', ')}.`);

  // 🎛️ USER PREFERENCES – Only if present
  const hasUserPrefs = userPreferences && Object.values(userPreferences).some(Boolean);
  if (hasUserPrefs) {
    lines.push('\n# USER PREFERENCES – Active');
    if (userPreferences?.answer_length)
      lines.push(`Adjust your response length to: ${userPreferences.answer_length}.`);
    if (userPreferences?.style_mode)
      lines.push(`Use ${userPreferences.style_mode} language style.`);
    if (userPreferences?.guidance_mode)
      lines.push(`Adopt a more ${userPreferences.guidance_mode} tone.`);
    if (userPreferences?.tone_preference)
      lines.push(`Maintain a ${userPreferences.tone_preference} tone.`);
  }

  // 🧾 SESSION META – Contextual adjustments
  if (sessionMeta?.hasRecentSilence || sessionMeta?.showsRepetition) {
    lines.push('If user shows silence or repetition, gently acknowledge the pause or pattern.');
  }
  if (sessionMeta?.isShortEntry)
    lines.push('Short input → reply concisely and softly.');
  if (sessionMeta?.isQuestion)
    lines.push('If question → answer clearly first, then expand reflectively.');
  if (sessionMeta?.isReflective)
    lines.push('If introspective → respond in a meditative rhythm.');

  // 🔚 CLOSURE STRATEGY
  lines.push('\n# CLOSURE STRATEGY');
  lines.push(`If user input is exactly: "${profile.metadata.closing_trigger}", treat this as session closure.`);
  lines.push(`Do not include this phrase in your reply. Respond with a final reflection in "${profile.metadata.closing_style}" style.`);
  if (sessionMeta?.isClosing) {
    lines.push('This is a closure. Do not ask follow-up questions.');
    lines.push('Offer a short, symbolic, emotionally resonant final reflection.');
    lines.push('Avoid prompting continuation.');
  }

  // 📐 REPLY TEMPLATE
  lines.push('\n# REPLY TEMPLATE');
  lines.push('Each response should have two parts:');
  lines.push('- 1. Reflective inner mirroring');
  lines.push('- 2. Soft, open-ended continuation prompt');
  lines.push('Separate sections with a line break. Keep response moderate in length.');

  return lines.join('\n');
}
