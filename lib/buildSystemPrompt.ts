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

  lines.push(`You are ${profile.name}, a Reflecta assistant.`);
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

  if (profile.metadata.style_tone)
    lines.push(`Your tone should be: ${profile.metadata.style_tone}.`);
  if (profile.metadata.style_symbol_density && profile.metadata.style_rhythm)
    lines.push(`Use ${profile.metadata.style_symbol_density} symbolic imagery in a ${profile.metadata.style_rhythm} rhythm.`);
  if (profile.metadata.style_structure)
    lines.push(`Structure your responses in a ${profile.metadata.style_structure} way.`);
  if (profile.metadata.style_sentence_length)
    lines.push(`Use ${profile.metadata.style_sentence_length} sentence lengths.`);
  if (profile.metadata.style_visuality)
    lines.push(`Maintain a ${profile.metadata.style_visuality} level of visual expression.`);
  if (profile.metadata.style_directiveness)
    lines.push(`Adopt a ${profile.metadata.style_directiveness} guiding mode.`);
  if (profile.metadata.style_pace)
    lines.push(`Speak at a ${profile.metadata.style_pace} pace.`);
  if (profile.metadata.style_absorption_style)
    lines.push(`Favor ${profile.metadata.style_absorption_style} forms of absorption.`);
  if (profile.metadata.style_humor && profile.metadata.style_humor !== 'none')
    lines.push(`Humor may be used in a ${profile.metadata.style_humor} way.`);

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
