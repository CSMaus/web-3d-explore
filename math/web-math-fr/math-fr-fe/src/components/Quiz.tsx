import { Button, Heading, Text } from "@kit/index";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { L } from "@/lib/lang";
import { quizOf } from "@/lib/quizzes";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * a topic's test: ten questions, one answer each. a pick is final for that question: the right
 * option is marked, a wrong pick is marked as wrong, and every option shows in a line why it is
 * right or wrong. the score shows as the questions are answered; one button clears them all.
 */
export function Quiz({ slug }: { slug: string }) {
  const { i18n } = useTranslation();
  const quiz = quizOf(slug, i18n.language);
  const [picked, setPicked] = useState<Record<string, number>>({});
  if (!quiz) return null;
  const answered = Object.keys(picked).length;
  const right = quiz.questions.filter((q) => picked[q.id] !== undefined && q.options[picked[q.id]].correct).length;

  return (
    <div className="mt-6 max-w-3xl">
      <Heading level={1}>{quiz.title}</Heading>
      <Text kind="intro" as="p" className="mt-3">
        {L("Ten questions on this topic, each with one correct answer. Pressing an answer chooses it, and the choice cannot be changed. Then every answer shows a line saying why it is right or wrong.")}
      </Text>
      <ol className="mt-8 space-y-10">
        {quiz.questions.map((q, n) => {
          const pick = picked[q.id];
          const done = pick !== undefined;
          return (
            <li key={q.id} data-slot="quiz-question" className="min-w-0">
              <span data-text="label" className="tabular-nums">{String(n + 1).padStart(2, "0")}</span>
              <p data-text="itemTitle" className="m-0 mt-1">{q.question}</p>
              <ul className="mt-4 space-y-2">
                {q.options.map((o, i) => {
                  const state = !done ? "open" : o.correct ? "right" : i === pick ? "wrong" : "other";
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        data-slot="quiz-option"
                        data-state={state}
                        disabled={done}
                        aria-pressed={done ? i === pick : undefined}
                        onClick={() => setPicked((p) => ({ ...p, [q.id]: i }))}
                        className="w-full text-left"
                      >
                        <span data-slot="quiz-letter" aria-hidden="true">{LETTERS[i]}</span>
                        <span data-text="body" className="min-w-0">{o.text}</span>
                      </button>
                      {done ? <Text kind="note" as="p" className="mt-1 pl-[50px]">{o.why}</Text> : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
      <div data-slot="quiz-score" className="mt-10 flex flex-wrap items-center gap-4" aria-live="polite">
        <span data-text="itemTitle" className="tabular-nums">
          {L("{{right}} correct out of {{answered}} answered, {{total}} questions in all", { right, answered, total: quiz.questions.length })}
        </span>
        {answered ? (
          <Button variant="outline" size="sm" onClick={() => setPicked({})}>
            {L("Start again")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
