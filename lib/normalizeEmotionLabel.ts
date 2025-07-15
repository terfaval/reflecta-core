export type EmotionCategory =
  | 'happy'
  | 'worried'
  | 'angry'
  | 'sad'
  | 'calm'
  | 'hopeful'
  | 'neutral';

interface EmotionMapping {
  keywords: string[];
  category: EmotionCategory;
}

const MAPPINGS: EmotionMapping[] = [
  { keywords: ['szorong', 'aggód'], category: 'worried' },
  { keywords: ['harag', 'düh'], category: 'angry' },
  { keywords: ['szomor'], category: 'sad' },
  { keywords: ['boldog', 'öröm'], category: 'happy' },
  { keywords: ['nyugodt', 'békés'], category: 'calm' },
  { keywords: ['remény'], category: 'hopeful' },
];

export function normalizeEmotionLabel(label: string): EmotionCategory {
  const lower = label.toLowerCase();
  for (const { keywords, category } of MAPPINGS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'neutral';
}