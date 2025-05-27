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
    prefs: userPreferences,
    meta: sessionMeta,
  });

  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  const prompt = buildSystemPrompt(profile, userPreferences, sessionMeta);
  promptCache.set(cacheKey, prompt);
  return prompt;
}
