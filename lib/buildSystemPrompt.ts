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

  // Alap identitás
  lines.push(profile.prompt_core.trim());
  lines.push('');

  // Profilkörnyezet
  lines.push(`Your worldview: "${profile.metadata.worldview}"`);
  lines.push(`You operate in the domain of: "${profile.metadata.domain}"`);
  lines.push(`Your inspirations include: ${profile.metadata.inspirations.join(', ')}.`);
  lines.push(`You are not suitable for: ${profile.metadata.not_suitable_for}`);
  if (profile.metadata.preferred_context) {
    lines.push(`You are best used in this context: ${profile.metadata.preferred_context}.`);
  }
  if (profile.metadata.response_focus) {
    lines.push(`Your replies should focus on: ${profile.metadata.response_focus}.`);
  }
  lines.push('');

  // Interakciós stílus
  const tempo = profile.metadata.style_options?.tempo || 'medium';
  const tone = profile.metadata.style_options?.hangnem || 'neutral';
  lines.push(`Your interaction tempo is ${tempo}. Your tone is ${tone}.`);
  if (profile.metadata.interaction_rhythm) {
    lines.push(`Use a rhythm like: ${profile.metadata.interaction_rhythm}.`);
  }
  lines.push('');

  // Reakciók
  lines.push('You may occasionally use the following interaction styles:');
  lines.push('- Common: ' + profile.reactions.common.join(' | '));
  lines.push('- Typical: ' + profile.reactions.typical.join(' | '));
  lines.push('- Rare: ' + profile.reactions.rare.join(' | '));
  lines.push('');

  // Kapcsolódási logikák
  if (profile.metadata.avoidance_logic) {
    lines.push(`Avoid this situation: ${profile.metadata.avoidance_logic}`);
  }
  lines.push('');

  // Kérdés- és metaforaalapú logika
  if (profile.metadata.question_archetypes?.length) {
    lines.push(`Your questions follow these archetypes: ${profile.metadata.question_archetypes.join(', ')}.`);
  }
  if (profile.metadata.primary_metaphors?.length) {
    lines.push(`You use these metaphors often: ${profile.metadata.primary_metaphors.join(', ')}.`);
  }
  lines.push('');

  // Csend és ismétlés felismerése
  if (sessionMeta?.hasRecentSilence || sessionMeta?.showsRepetition) {
    lines.push('If the user seems silent or repetitive, you may gently reflect or acknowledge the pause.');
  }

  // Lezárás felismerése
  lines.push(`If the user says: "${profile.metadata.closing_trigger}", this indicates session closure.`);
  lines.push(`Respond in a style of: ${profile.metadata.closing_style}.`);
  lines.push('');

  // Felhasználói preferenciák
  if (userPreferences) {
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
      lines.push(`Adjust your behavior to user preferences: ${prefs.join('; ')}.`);
  }

  // Kulcsszavak
  lines.push(`Pay attention to these keywords: ${profile.metadata.highlight_keywords.join(', ')}.`);

  // Ajánlások
  if (profile.metadata.recommendation_logic) {
    lines.push(`If appropriate, you may suggest: ${profile.metadata.recommendation_logic}`);
  }

  // Válaszstílus ritmus alapján
  if (sessionMeta?.isShortEntry) {
    lines.push('If the user input is very short, reply in a minimal and gentle way, avoid overexplaining.');
  }
  if (sessionMeta?.isQuestion) {
    lines.push('If the user asked a question, answer it clearly and directly first, then you may elaborate.');
  }
  if (sessionMeta?.isReflective) {
    lines.push('If the user seems introspective, respond in a soft and meditative rhythm.');
  }

  // 🔧 Zárás-specifikus utasítás (ha van isClosing meta)
if (sessionMeta?.isClosing) {
  lines.push('');
  lines.push('This is a session closure. Do not ask follow-up questions.');
  lines.push('Offer a short, symbolic, emotionally resonant closing reflection.');
  lines.push('Use a warm and slow tone, and avoid prompting continuation.');
  lines.push('Use line breaks for inner shifts. 2–3 paragraphs are enough.');
} else {
  lines.push('');
  lines.push('Always interpret the user input deeply. Pay attention to emotional tone, corrections, and underlying meaning.');
  lines.push('Structure your response in two parts:');
  lines.push('- First: a short, reflective response connecting to the user’s inner experience.');
  lines.push('- Second: ask a soft, open-ended question that invites continuation without pressure.');
  lines.push('Format your reply in 2–3 clear paragraphs. Use line breaks to make transitions and inner shifts visible.');
}

  return lines.join('\n');
}
