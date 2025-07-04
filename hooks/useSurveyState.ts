import { useState } from 'react';

export function useSurveyState<T>(initialQuestions: T[]) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<string[]>(
    initialQuestions.map(() => '')
  );

  const total = initialQuestions.length;

  const currentQuestion = initialQuestions[index];

  const isFirstQuestion = index === 0;
  const isLastQuestion = index === total - 1;

  const progress = ((index + 1) / total) * 100;

  const nextQuestion = () => {
    setDirection(1);
    setIndex((prev) => (prev < total - 1 ? prev + 1 : prev));
  };

  const prevQuestion = () => {
    setDirection(-1);
    setIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const setAnswer = (value: string, qIndex = index) => {
    setAnswers((prev) => {
      const arr = [...prev];
      arr[qIndex] = value;
      return arr;
    });
  };

  const resetSurvey = () => {
    setIndex(0);
    setDirection(1);
    setAnswers(initialQuestions.map(() => ''));
  };

  return {
    currentQuestion,
    answers,
    progress,
    nextQuestion,
    prevQuestion,
    setAnswer,
    isFirstQuestion,
    isLastQuestion,
    resetSurvey,
    direction,
    step: index,
    total,
  };
}

export type UseSurveyStateReturn<T> = ReturnType<typeof useSurveyState<T>>;