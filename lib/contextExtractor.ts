// File: lib/contextExtractor.ts

import type { EvaluationContext } from './evaluateTriggerCondition';

function countOccurrences(text: string, patterns: string[]): number {
  const lowered = text.toLowerCase();
  return patterns.reduce((sum, pattern) => {
    const regex = new RegExp(pattern, 'gi');
    const matches = lowered.match(regex);
    return sum + (matches ? matches.length : 0);
  }, 0);
}

function detectSymbolicLanguage(text: string): boolean {
  const symbolicWords = [
    'köd', 'álom', 'üresség', 'fény', 'barlang', 'csend', 'tenger', 'szakadék', 'moha'
  ];
  return symbolicWords.some(word => text.toLowerCase().includes(word));
}

function estimateAbstractDensity(text: string): number {
  const abstractWords = [
    'létezés', 'vágy', 'idő', 'értelem', 'belső', 'határ', 'váltás', 'valóság'
  ];
  return countOccurrences(text, abstractWords);
}

function detectEmotionTags(text: string): string[] {
  const tags: string[] = [];
  const lowered = text.toLowerCase();
  if (/magány|egyedül|elhagyott/.test(lowered)) tags.push('loneliness');
  if (/szomorú|fájdalom|könny/.test(lowered)) tags.push('sadness');
  if (/zavar|összezavar|nem tudom/.test(lowered)) tags.push('confusion');
  if (/fázom|hideg|üresség/.test(lowered)) tags.push('numbness');
  return tags;
}

export function extractContext(message: string): EvaluationContext {
  return {
    message,
    entryLength: message.length,
    tags: detectEmotionTags(message),
    features: {
      numbness_mentions: countOccurrences(message, ['zsibbadt', 'nem érzek', 'elzsibbadt', 'nem érzek semmit']),
      symbolic_language: detectSymbolicLanguage(message),
      abstract_density: estimateAbstractDensity(message)
    },
    sessionStats: {} // később ide jöhet: silenceSeconds, patternRepeat stb.
  };
}
