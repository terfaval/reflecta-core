// Reflecta: buildSystemPrompt()
// Típusdefiníciók
interface UserPreferences {
  answer_length?: 'short' | 'long';
  style_mode?: 'simple' | 'symbolic';
  guidance_mode?: 'free' | 'guided';
  tone_preference?: 'supportive' | 'confronting' | 'soothing';
}

interface SessionMeta {
  hasRecentSilence?: boolean;
  showsRepetition?: boolean;
  isShortEntry?: boolean;
  isQuestion?: boolean;
  isReflective?: boolean;
  isClosing?: boolean; // ✅ EZ KELL
}


interface ProfileMetadata {
  domain: string;
  worldview: string;
  inspirations: string[];
  not_suitable_for: string;
  style_options: Record<string, string>;
  closing_trigger: string;
  closing_style: string;
  highlight_keywords: string[];
  recommendation_logic?: string;

  preferred_context?: string;
  response_focus?: string;
  primary_metaphors?: string[];
  question_archetypes?: string[];
  interaction_rhythm?: string;
  connects_well_after?: string[];
  connects_well_before?: string[];
  avoidance_logic?: string;
}

interface Profile {
  name: string;
  prompt_core: string;
  description: string;
  metadata: ProfileMetadata;
  reactions: {
    common: string[];
    typical: string[];
    rare: string[];
  };
}

export function buildSystemPrompt(
  profile: Profile,
  userPreferences?: UserPreferences,
  sessionMeta?: SessionMeta
): string {
  const lines: string[] = [];

  // ========== [IDENTITY] ==========
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

  // ========== [STYLE CONFIGURATION] ==========
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

  // ========== [REACTIONS] ==========
  lines.push('\n# REACTIONS');
  lines.push(`- Common: ${profile.reactions.common.join(' | ')}`);
  lines.push(`- Typical: ${profile.reactions.typical.join(' | ')}`);
  lines.push(`- Rare: ${profile.reactions.rare.join(' | ')}`);

  // ========== [QUESTION / METAPHORS / AVOIDANCE] ==========
  lines.push('\n# STRUCTURE & CONTENT');
  if (profile.metadata.question_archetypes?.length)
    lines.push(`Use question archetypes: ${profile.metadata.question_archetypes.join(', ')}`);
  if (profile.metadata.primary_metaphors?.length)
    lines.push(`Use metaphors: ${profile.metadata.primary_metaphors.join(', ')}`);
  if (profile.metadata.avoidance_logic)
    lines.push(`Avoid logic: ${profile.metadata.avoidance_logic}`);

  // ========== [PREFERENCES] ==========
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

  // ========== [SESSION META] ==========
  if (sessionMeta?.hasRecentSilence || sessionMeta?.showsRepetition) {
    lines.push('If user shows silence or repetition, gently acknowledge the pause.');
  }
  if (sessionMeta?.isShortEntry)
    lines.push('Short input → reply concisely and softly.');
  if (sessionMeta?.isQuestion)
    lines.push('If question → answer directly first, then elaborate.');
  if (sessionMeta?.isReflective)
    lines.push('If introspective → respond in meditative rhythm.');

  // ========== [CLOSURE] ==========
  lines.push('\n# CLOSING');
  lines.push(`Closure trigger: "${profile.metadata.closing_trigger}" → use: ${profile.metadata.closing_style}`);
  if (sessionMeta?.isClosing) {
    lines.push('This is a closure. Do not ask follow-up questions.');
    lines.push('Offer short, symbolic, emotionally resonant final reflection.');
    lines.push('Avoid prompting continuation.');
  }

  // ========== [REPLY STRUCTURE] ==========
  lines.push('\n# DEFAULT REPLY STRUCTURE');
  lines.push('Always interpret deeply. Pay attention to emotional tone.');
  lines.push('Respond in two parts:');
  lines.push('- 1. Reflective inner mirroring');
  lines.push('- 2. Soft open-ended continuation prompt');
  lines.push('Use line breaks to separate transitions. Keep length moderate.');

  return lines.join('\n');
}
