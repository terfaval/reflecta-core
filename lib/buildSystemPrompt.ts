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
}

interface ProfileMetadata {
  domain: string;
  worldview: string;
  inspirations: string[];
  not_suitable_for: string;
  style_options: Record<string, string>; // pl. tempo, hangnem
  closing_trigger: string;
  closing_style: string;
  highlight_keywords: string[];
  recommendation_logic?: string;
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
  lines.push('');

  // Interakciós stílus
  const tempo = profile.metadata.style_options?.tempo || 'medium';
  const tone = profile.metadata.style_options?.hangnem || 'neutral';
  lines.push(`Your interaction tempo is ${tempo}. Your tone is ${tone}.`);
  lines.push('');

  // Reakciók
  lines.push('You may occasionally use the following interaction styles:');
  lines.push('- Common: ' + profile.reactions.common.join(' | '));
  lines.push('- Typical: ' + profile.reactions.typical.join(' | '));
  lines.push('- Rare: ' + profile.reactions.rare.join(' | '));
  lines.push('');

  // Csend és ismétlés felismerése
  if (sessionMeta?.hasRecentSilence || sessionMeta?.showsRepetition) {
    lines.push('If the user seems silent or repetitive, you may gently reflect or acknowledge the pause.');
  }

  // Lezárás felismerése
  lines.push(`If the user says: "${profile.metadata.closing_trigger}", this indicates session closure.`);
  lines.push(`Respond in a style of: ${profile.metadata.closing_style}.`);
  lines.push('');

  // Felhasználói preferenciák (ha vannak)
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

  // Highlight kulcsszavak (későbbi visszacsatolásra)
  lines.push(`Pay attention to these keywords: ${profile.metadata.highlight_keywords.join(', ')}.`);

  // Opcionális ajánlások
  if (profile.metadata.recommendation_logic) {
    lines.push(`If appropriate, you may suggest: ${profile.metadata.recommendation_logic}`);
  }

  return lines.join('\n');
}
