import { NextRouter } from 'next/router';

export function redirectToChat(
  router: NextRouter,
  conversationId?: string,
  sessionId?: string,
  existing?: boolean,
) {
  const params = new URLSearchParams();
  if (conversationId) params.append('conversation', conversationId);
  if (sessionId) params.append('session', sessionId);
  if (existing) params.append('existing', '1');
  const query = params.toString();
  const path = query ? `/chat?${query}` : '/chat';
  router.push(path);
}