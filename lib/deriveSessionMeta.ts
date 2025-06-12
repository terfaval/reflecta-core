export function deriveSessionMeta(
  entries: { role: string; content: string; created_at?: string }[],
  closingTrigger?: string
): SessionMeta {
  const userEntries = entries.filter(e =>
    e.role === 'user' && (!closingTrigger || e.content.trim() !== closingTrigger)
  );

  const lastUserEntry = userEntries[userEntries.length - 1];
  const secondLastUserEntry = userEntries[userEntries.length - 2];

  const content = lastUserEntry?.content?.trim() ?? '';
  const recentContents = userEntries.slice(-3).map(e => e.content.trim());

  const isShortEntry = content.length < 50;

  const isQuestion = /\?$/.test(content) || /\b(miért|hogyan|vajon|lehet-e|szerinted|mit gondolsz|működik-e)\b/i.test(content);

  const isReflective = /\b(érzem|gondolom|hiszem|talán|nem tudom|lehet, hogy|olyan, mintha|néha)\b/i.test(content);

  const showsRepetition = new Set(recentContents).size <= 2;

  let hasRecentSilence = false;
  if (lastUserEntry?.created_at && secondLastUserEntry?.created_at) {
    const last = new Date(lastUserEntry.created_at);
    const secondLast = new Date(secondLastUserEntry.created_at);
    const minutes = (last.getTime() - secondLast.getTime()) / 1000 / 60;
    hasRecentSilence = minutes > 5;
  }

  return {
    isShortEntry,
    isQuestion,
    isReflective,
    showsRepetition,
    hasRecentSilence,
  };
}
