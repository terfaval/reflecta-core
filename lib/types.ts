export interface ProfileMetadata {
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

export interface Profile {
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

export interface UserPreferences {
  answer_length?: 'short' | 'long';
  style_mode?: 'simple' | 'symbolic';
  guidance_mode?: 'free' | 'guided';
  tone_preference?: 'supportive' | 'confronting' | 'soothing';
}

export interface SessionMeta {
  hasRecentSilence?: boolean;
  showsRepetition?: boolean;
  isShortEntry?: boolean;
  isQuestion?: boolean;
  isReflective?: boolean;
  isClosing?: boolean;
}