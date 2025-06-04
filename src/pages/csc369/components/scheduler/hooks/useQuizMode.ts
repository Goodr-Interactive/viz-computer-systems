import { useState } from "react";
import type { QuizController, QuizQuestion } from "../types";

export const useQuizMode = (): QuizController => {
  const [results, setResults] = useState<Array<[QuizQuestion, number]>>([]);
  const [question, setQuestion] = useState<QuizQuestion | undefined>();

  const answer = (pid: number) => {
    if (question) {
      setResults((r) => [...r, [question, pid]]);
      setQuestion(undefined);
    }
  };

  const reset = () => {
    setResults([]);
    setQuestion(undefined);
  };

  const skip = () => {
    setQuestion(undefined);
  };

  return {
    answer,
    results,
    reset,
    setQuestion,
    question,
    skip,
  };
};
