// --- Style schema for fine-tuned prompt behavior
export interface StyleProfile {
  style_tone?: string;
  style_symbol_density?: 'low' | 'medium' | 'high' | string;
  style_rhythm?: 'linear' | 'cyclical' | 'wave-like' | 'spiral' | string;
  style_structure?: 'linear' | 'labyrinthine' | 'drifting' | string;
  style_sentence_length?: 'short' | 'long' | 'variable' | string;
  style_visuality?: 'minimal' | 'medium' | 'high' | string;
  style_directiveness?: 'directive' | 'reflective' | 'resonant' | string;
  style_pace?: 'slow' | 'medium' | 'fast' | string;
  style_absorption_style?: 'mythic' | 'logical' | 'sensory' | 'narrative' | string;
  style_humor?: 'none' | 'subtle' | 'trickster' | string;
}

// --- Metadata connected to the thematic, stylistic and rhythmical tuning
export interface ProfileMetadata {
  domain: string;
  worldview: string;
  inspirations: string[];
  not_suitable_for: string[];
  style_options: StyleProfile;
  closing_trigger: string;
  closing_style: string;
  highlight_keywords: string[];
  recommendation_logic?: string;
  preferred_context?: string[];
  response_focus?: string;
  primary_metaphors?: string[];
  question_archetypes?: string[];
  interaction_rhythm?: string;
  connects_well_after?: string[];
  connects_well_before?: string[];
  avoidance_logic?: string[];

// --- Full profile object
export interface Profile {
  name: string;
  prompt_core: string;
  metadata: ProfileMetadata;
  };
}

// --- User preferences set via UI toggle
export interface UserPreferences {
  answer_length?: 'very short' | 'short' | 'long' | 'very long';
  style_mode?: 'minimal' | 'simple' | 'symbolic' | 'mythic';
  guidance_mode?: 'open' | 'free' | 'guided' | 'directed';
  tone_preference?: 'supportive' | 'confronting' | 'soothing';
}

// --- Session-specific dynamic flags
export interface SessionMeta {
  hasRecentSilence?: boolean;
  showsRepetition?: boolean;
  isShortEntry?: boolean;
  isQuestion?: boolean;
  isReflective?: boolean;
  isClosing?: boolean;
}
