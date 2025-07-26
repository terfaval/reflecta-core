import { apiFetch } from './api';
import { SessionMap } from '@/contexts/SessionContext';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface SessionResult {
  sessionId: string;
  entries: Entry[];
  isNew: boolean;
  closingTrigger: string;
}

export class SessionManager {
  private sessionMap: SessionMap = {};

  constructor(map?: SessionMap) {
    if (map) this.sessionMap = map;
  }

  setMap(map: SessionMap) {
    this.sessionMap = map;
  }

  async init(
    profile: string,
    userId: string,
    userRole: string,
    urlSessionId?: string,
  ): Promise<SessionResult> {
    if (userRole === 'guest') {
      return { sessionId: '', entries: [], isNew: true, closingTrigger: '' };
    }

    const closingTrigger = await this.fetchClosingTrigger(profile, userId);

    if (urlSessionId) {
      const fromUrl = await this.loadFromUrl(urlSessionId);
      if (fromUrl) {
        sessionStorage.setItem(`reflecta_session_${profile}`, fromUrl.sessionId);
        return { ...fromUrl, isNew: false, closingTrigger };
      }
    }

    const fromStorage = await this.loadFromStorage(profile);
    if (fromStorage) {
      return { ...fromStorage, isNew: false, closingTrigger };
    }

    const fromContext = await this.loadFromContext(profile, this.sessionMap);
    if (fromContext) {
      sessionStorage.setItem(`reflecta_session_${profile}`, fromContext.sessionId);
      return { ...fromContext, isNew: false, closingTrigger };
    }

    const created = await this.createNewSession(profile, userId);
    if (!created) {
      return { sessionId: '', entries: [], isNew: true, closingTrigger };
    }
    sessionStorage.setItem(`reflecta_session_${profile}`, created.sessionId);
    return {
      sessionId: created.sessionId,
      entries: created.entries,
      isNew: true,
      closingTrigger: created.closingTrigger || closingTrigger,
    };
  }

  async loadFromUrl(
    sessionId: string,
  ): Promise<{ sessionId: string; entries: Entry[] } | null> {
    const params = new URLSearchParams({ sessionId });
    try {
      const valid = await apiFetch<{ valid: boolean }>(
        `/api/session/validate?${params.toString()}`,
      );
      if (!valid.valid) return null;
    } catch {
      return null;
    }

    try {
      const data = await apiFetch<{ entries?: Entry[] }>(
        `/api/entries?sessionId=${encodeURIComponent(sessionId)}`,
      );
      return { sessionId, entries: data.entries || [] };
    } catch {
      return null;
    }
  }

  async loadFromStorage(
    profile: string,
  ): Promise<{ sessionId: string; entries: Entry[] } | null> {
    const stored = sessionStorage.getItem(`reflecta_session_${profile}`);
    if (!stored) return null;
    const data = await this.loadFromUrl(stored);
    if (!data) {
      sessionStorage.removeItem(`reflecta_session_${profile}`);
    }
    return data;
  }

  async loadFromContext(
    profile: string,
    sessionMap: SessionMap,
  ): Promise<{ sessionId: string; entries: Entry[] } | null> {
    const conv = sessionMap[profile]?.[0];
    const sess = conv?.sessions?.find((s) => !s.ended_at);
    if (!sess) return null;
    return this.loadFromUrl(sess.id);
  }

  async createNewSession(
    profile: string,
    userId: string,
  ): Promise<{ sessionId: string; entries: Entry[]; closingTrigger: string } | null> {
    try {
      await apiFetch('/api/starting-prompt', {
        method: 'POST',
        body: JSON.stringify({ userId, profile }),
      });
    } catch {
      // ignore prompt failure
    }

    try {
      const data = await apiFetch<{
        session_id?: string;
        conversation_id?: string;
        is_new?: boolean;
        closing_trigger?: string;
      }>('/api/start-session', {
        method: 'POST',
        body: JSON.stringify({ profile, user_id: userId, create_new: true }),
      });
      if (!data.session_id) return null;
      return {
        sessionId: data.session_id,
        entries: [],
        closingTrigger: data.closing_trigger || '',
      };
    } catch {
      return null;
    }
  }

  private async fetchClosingTrigger(profile: string, userId: string) {
    try {
      const data = await apiFetch<{ closing_trigger?: string }>('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ name: profile, userId }),
      });
      return data.closing_trigger || '';
    } catch {
      return '';
    }
  }
}
