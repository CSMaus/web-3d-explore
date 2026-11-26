/**
 * the tests at the end of each topic, ten questions each, in src/content/quizzes: the English files
 * at the top, a folder per other language beside them. a language without its own file shows the
 * English one.
 */
export type QuizOption = { text: string; correct: boolean; why: string };
export type QuizQuestion = { id: string; question: string; options: QuizOption[] };
export type Quiz = { slug: string; title: string; questions: QuizQuestion[] };

const FILES = import.meta.glob<Quiz>("../content/quizzes/**/*.json", { eager: true, import: "default" });

export function quizOf(slug: string, lang: string): Quiz | null {
  const own = FILES[`../content/quizzes/${lang}/${slug}.json`];
  return own ?? FILES[`../content/quizzes/${slug}.json`] ?? null;
}
