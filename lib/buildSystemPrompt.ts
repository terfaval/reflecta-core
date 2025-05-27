import type { Profile, UserPreferences, SessionMeta } from './types';

export function buildSystemPrompt(
  profile: Profile,
  userPreferences?: UserPreferences,
  sessionMeta?: SessionMeta
): string {
  const lines: string[] = [];

  lines.push(profile.prompt_core.trim());
  lines.push('');
  lines.push(`# IDENTITY`);
  lines.push(`Worldview: ${profile.metadata.worldview}`);
  lines.push(`Domain: ${profile.metadata.domain}`);
  lines.push(`Inspirations: ${profile.metadata.inspirations.join(', ')}`);
  lines.push(`Avoid if: ${profile.metadata.not_suitable_for}`);
  if (profile.metadata.preferred_context)
    lines.push(`Preferred context: ${profile.metadata.preferred_context}`);
  if (profile.metadata.response_focus)
    lines.push(`Response focus: ${profile.metadata.response_focus}`);

  lines.push('\n# STYLE');
  const metaStyle =
    typeof profile.metadata.style_options === 'string'
      ? JSON.parse(profile.metadata.style_options)
      : profile.metadata.style_options || {};

  const coreStyle =
    typeof (profile as any).style_profile === 'string'
      ? JSON.parse((profile as any).style_profile)
      : (profile as any).style_profile || {};

  const styleConfig = { ...metaStyle, ...coreStyle };
  if (Object.keys(styleConfig).length > 0) {
    const styleDesc = Object.entries(styleConfig)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('; ');
    lines.push(`Style configuration: ${styleDesc}`);
  }
  if (profile.metadata.interaction_rhythm)
    lines.push(`Interaction rhythm: ${profile.metadata.interaction_rhythm}`);

  lines.push('\n# REACTIONS');
  lines.push(`- Common: ${profile.reactions.common.join(' | ')}`);
  lines.push(`- Typical: ${profile.reactions.typical.join(' | ')}`);
  lines.push(`- Rare: ${profile.reactions.rare.join(' | ')}`);

  lines.push('\n# STRUCTURE & CONTENT');
  if (profile.metadata.question_archetypes?.length)
    lines.push(`Use question archetypes: ${profile.metadata.question_archetypes.join(', ')}`);
  if (profile.metadata.primary_metaphors?.length)
    lines.push(`Use metaphors: ${profile.metadata.primary_metaphors.join(', ')}`);
  if (profile.metadata.avoidance_logic)
    lines.push(`Avoid logic: ${profile.metadata.avoidance_logic}`);

  if (userPreferences) {
    lines.push('\n# USER PREFERENCES');
    const prefs: string[] = [];
    if (userPreferences.answer_length)
      prefs.push(`prefer ${userPreferences.answer_length} responses`);
    if (userPreferences.style_mode)
      prefs.push(`use ${userPreferences.style_mode} language`);
    if (userPreferences.guidance_mode)
      prefs.push(`be more ${userPreferences.guidance_mode}`);
    if (userPreferences.tone_preference)
      prefs.push(`maintain a ${userPreferences.tone_preference} tone`);
    if (prefs.length)
      lines.push(`Adjust to user preferences: ${prefs.join('; ')}.`);
  }

  if (sessionMeta?.hasRecentSilence || sessionMeta?.showsRepetition) {
    lines.push('If user shows silence or repetition, gently acknowledge the pause.');
  }
  if (sessionMeta?.isShortEntry)
    lines.push('Short input → reply concisely and softly.');
  if (sessionMeta?.isQuestion)
    lines.push('If question → answer directly first, then elaborate.');
  if (sessionMeta?.isReflective)
    lines.push('If introspective → respond in meditative rhythm.');

  lines.push('\n# CLOSING');
  lines.push(`If the user input matches exactly: "${profile.metadata.closing_trigger}", treat this as a signal to close the session.`);
  lines.push(`Do not include this phrase in your response. Respond with a final reflection in the "${profile.metadata.closing_style}" style.`);
  if (sessionMeta?.isClosing) {
  lines.push('This is a closure. Do not ask follow-up questions.');
  lines.push('Offer a short, symbolic, emotionally resonant final reflection.');
  lines.push('Avoid prompting continuation or exploration.');
  lines.push('Do not end your message with a question or ellipsis.');
  lines.push('Do not include open-ended or suggestive phrasing.');
}


  lines.push('\n# DEFAULT REPLY STRUCTURE');
  lines.push('Always interpret deeply. Pay attention to emotional tone.');
  lines.push('Respond in two parts:');
  lines.push('- 1. Reflective inner mirroring');
  lines.push('- 2. Soft open-ended continuation prompt');
  lines.push('Use line breaks to separate transitions. Keep length moderate.');

  return lines.join('\n');
}