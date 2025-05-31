import { buildSystemPrompt } from './buildSystemPrompt';
import type { Profile, UserPreferences, SessionMeta } from './types';

const promptCache = new Map<string, string>();

export function getCachedSystemPrompt(
  profile: Profile,
  userPreferences?: UserPreferences,
  sessionMeta?: SessionMeta
): string {
  const cacheKey = JSON.stringify({
    profile: profile.name,
    prompt_core: profile.prompt_core,
    style: profile.metadata?.style_options,
    prefs: userPreferences ?? null,
    meta: sessionMeta ?? null,
  });

  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  const prompt = buildSystemPrompt(profile, userPreferences, sessionMeta);
  promptCache.set(cacheKey, prompt);
  return prompt;
}

// Optional manual reset if needed
export function clearPromptCache() {
  promptCache.clear();
}
