import type { Profile, UserPreferences, SessionMeta, StyleProfile } from './types';

function humanList(items: string[], conjunction: 'and' | 'or' = 'and'): string {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}

export function buildSystemPrompt(
  profile: Profile,
  userPreferences?: UserPreferences,
  sessionMeta?: SessionMeta
): string {
  const lines: string[] = [];

  // 👤 IDENTITY
  if (profile.prompt_core?.trim()) {
    lines.push(profile.prompt_core.trim(), '');
  }

  lines.push(`You speak from the sense that: "${profile.metadata.worldview}".`);

  // INSPIRATIONAL BACKGROUND

  const inspirationList = humanList(profile.metadata.inspirations ?? [], 'and');
  lines.push(`Your voice carries echoes of traditions like ${inspirationList}, shaping both how you speak and how you see.`);

  // LIMITATIONS & BOUNDARIES

  const avoidList = humanList(profile.metadata.not_suitable_for ?? [], 'or');
  const avoidlogicList = humanList(profile.metadata.avoidance_logic ?? [], 'or');
  lines.push(`There are themes and contexts where your presence may not be the most helpful. These include: ${avoidList}.`);
  lines.push(`If the user's input matches any of these boundaries ${avoidlogicList}, respond gently. Acknowledge the user's intent with care, and — if possible — offer a soft redirection that stays within your scope.`);

  // INTUITIVE ALIGNMENT

  const context = humanList(profile.metadata.preferred_context ?? [], 'and');
  const archetypes = humanList(profile.metadata.question_archetypes ?? [], 'or');
  lines.push(`You tend to come alive in settings like ${context}.`);
  lines.push(`When it fits the moment, you may ask in the spirit of ${archetypes} — not to direct, but to gently open something within.`);
  lines.push(`Always prioritize the user's tone and intention — follow their lead.`);

  // ✨ STYLE & STRUCTURE

const styleDictionary: Record<string, Record<string, string>> = {
  style_pace: {
    slow: 'a slow and deliberate pace',
    gentle: 'a gentle, unhurried pace',
    'medium-slow': 'a calm, measured tempo',
    'slow-breath': 'a breath-paced rhythm',
    medium: 'a steady, natural rhythm',
  },
  style_tone: {
    'neutral-deep': 'a calm and contemplative tone',
    'warm-personal': 'a warm, personal tone',
    'symbolic-reflective': 'a symbolic and thoughtful tone',
    'playful-visual': 'a playful, image-rich tone',
    'calm-archival': 'a calm and precise tone',
    'evocative-gentle': 'a gently evocative tone',
    enigmatic: 'a mysterious, layered tone',
    inviting: 'an inviting, open tone',
    'clear-objective': 'a clear and grounded tone',
  },
  style_symbol_density: {
    high: 'rich in symbolic images',
    medium: 'some symbolic imagery',
    low: 'mostly direct language',
  },
  style_rhythm: {
    ritualistic: 'with a ritual-like rhythm',
    fluid: 'in a flowing, natural rhythm',
    cyclical: 'returning in cycles, like seasons',
    'wave-like': 'like the movement of waves',
    'spiral-linear': 'unfolding in a spiral, yet directed line',
    layered: 'with gently layered rhythm',
    labyrinthine: 'exploring winding inner paths',
    grounded: 'a steady and anchored rhythm',
    linear: 'a step-by-step, linear unfolding',
  },
  style_sentence_length: {
    short: 'short, focused lines',
    variable: 'a mix of short and long phrases',
    long: 'extended, flowing thoughts',
    medium: 'balanced-length phrases',
    'medium-long': 'gently extended sentences',
  },
  style_structure: {
    spiral: 'unfolding like a spiral',
    relational: 'guided by relationship and resonance',
    narrative: 'following a storytelling arc',
    associative: 'moving through associations',
    'summary-reflective': 'summarizing with reflective pauses',
    drifting: 'gently drifting between thoughts',
    'mythic-paradoxical': 'with poetic, sometimes paradoxical flow',
    sequential: 'a clear, step-by-step logic',
    structured: 'a clearly organized structure',
  },
  style_visuality: {
    high: 'strongly image-rich',
    low: 'low in imagery',
    temporal: 'evoking inner shifts over time',
    patterned: 'using recognizable visual motifs',
    dreamlike: 'dreamlike visual impressions',
    sensory: 'grounded in sensory images',
    minimal: 'minimal or abstract imagery',
  },
  style_directiveness: {
    passive: 'passive, allowing space',
    reflective: 'gently mirroring the user',
    guiding: 'softly guiding the direction',
    echoing: 'echoing and rephrasing the user’s tone',
    questioning: 'gently inquisitive',
    'gentle-guiding': 'lightly leading without pressure',
    'non-directive': 'supportive, without steering',
  },
  style_humor: {
    subtle: 'subtle, warm humor',
    mythic: 'archetypal, symbolic humor',
    none: '',
  },
  style_absorption_style: {
    intuitive: 'intuitively immersive',
    empathic: 'emotionally attuned and absorbing',
    imagistic: 'drawing attention through imagery',
    integrative: 'weaving threads into coherence',
    'sensory-reverie': 'immersing through sensory reverie',
    symbolic: 'symbolic absorption',
    somatic: 'embodied, physical sensitivity',
    logical: 'intellectually absorbing',
  },
};

const style: StyleProfile = {
  ...(profile.metadata.style_options ?? {}),
  ...((profile as any).style_profile ?? {}),
};

const styleFragments: string[] = [];

for (const key in styleDictionary) {
  const value = (style as any)[key];
  const mapped = styleDictionary[key]?.[value];
  if (mapped && mapped !== '') styleFragments.push(mapped);
}

if (styleFragments.length) {
  const styleSummary = humanList(styleFragments, 'and');
  lines.push(`You tend to speak ${styleSummary}.`);
}

const rhythmLabel = profile.metadata.interaction_rhythm;
if (rhythmLabel) {
  lines.push(`You tend to follow an interaction rhythm that feels ${rhythmLabel} — let this shape your pacing, pauses, and how you pass the conversation back.`);
}

  // 🎛️ USER PREFERENCES – Only if present
  const hasUserPrefs = userPreferences && Object.values(userPreferences).some(Boolean);
  if (hasUserPrefs) {
  const prefsFragments: string[] = [];

  const mapAnswerLength = {
    'very short': 'keep things very brief',
    short: 'stay concise',
    long: 'feel free to expand your thoughts',
    'very long': 'let your ideas unfold fully'
  };

  const mapStyleMode = {
    minimal: 'a minimalist tone',
    simple: 'a plain and clear style',
    symbolic: 'symbolic and image-rich language',
    mythic: 'mythic or archetypal expression'
  };

  const mapGuidance = {
    open: 'an open-ended spirit',
    free: 'a gentle, non-directive style',
    guided: 'a clear and structured approach',
    directed: 'directive, intentional guidance'
  };

  if (userPreferences.answer_length)
    prefsFragments.push(mapAnswerLength[userPreferences.answer_length]);

  if (userPreferences.style_mode)
    prefsFragments.push(`use ${mapStyleMode[userPreferences.style_mode]}`);

  if (userPreferences.guidance_mode)
    prefsFragments.push(`follow ${mapGuidance[userPreferences.guidance_mode]}`);

  if (userPreferences.tone_preference)
    prefsFragments.push(`keep a ${userPreferences.tone_preference} tone`);

  if (prefsFragments.length) {
    const prefsSummary = humanList(prefsFragments, 'and');
    lines.push(`The user has certain preferences — try to ${prefsSummary}.`);
  }
}

  // SESSION META – subtle adjustments to context

if (
  sessionMeta?.hasRecentSilence ||
  sessionMeta?.showsRepetition ||
  sessionMeta?.isShortEntry ||
  sessionMeta?.isQuestion ||
  sessionMeta?.isReflective
) {
  lines.push(`Let your responses be shaped by the user's tone and rhythm.`);

  if (sessionMeta.hasRecentSilence || sessionMeta.showsRepetition)
    lines.push(`If you notice a pause or a returning pattern, acknowledge it gently — as one might notice a breath or a wave.`);

  if (sessionMeta.isShortEntry)
    lines.push(`If the user offers just a few words, stay close. Keep your response soft and concise.`);

  if (sessionMeta.isQuestion)
    lines.push(`When a question is asked, begin with a clear response — then let it unfold into a more reflective tone.`);

  if (sessionMeta.isReflective)
    lines.push(`When the user turns inward, let your words slow down. Respond as if you're accompanying an inner movement.`);
}

  // CLOSURE STRATEGY

const trigger = profile.metadata.closing_trigger;
const closingstyle = profile.metadata.closing_style;

if (trigger) {
  lines.push(`If the user chooses to end the session with the phrase: "${trigger}", do not echo it back. Instead, recognize it as a signal of closure.`);

  lines.push(`Offer a final reflection that fits the mood — something brief, symbolic, and emotionally resonant.`);

  lines.push(`Let it match the style of closure this profile prefers: "${closingstyle}".`);
}

if (sessionMeta?.isClosing) {
  lines.push(`This moment marks the closing of the session.`);
  lines.push(`Do not ask further questions or invite continuation.`);
  lines.push(`Leave the user with a sense of stillness, insight, or quiet companionship — and let the rest be silence.`);
}


  // REPLY TEMPLATE

lines.push(`Each response you offer can have a gentle structure.`);

lines.push(`Begin by holding up a mirror — reflect something the user just shared, as if you're gently naming its shape or mood.`);

lines.push(`Then, if the moment allows, invite a next step. This might be a quiet prompt, an open question, or a space left for them to continue in their own way.`);

lines.push(`Let these two parts be separated by a natural pause or line break. Keep your reply spacious enough to breathe, but clear enough to guide.`);

lines.push(`And always remember: your purpose is not to lead, but to accompany — with presence, care, and clarity.`);

return lines.join('\n');
}

