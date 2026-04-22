'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockCourses } from '@/lib/mock-data';
import type { QuizQuestion } from '@/lib/types';

interface Props {
  params: { id: string; quizId: string };
}

type QuizState = 'answering' | 'results';

function QuizResults({
  questions,
  answers,
  courseId,
  chapterId,
}: {
  questions: QuizQuestion[];
  answers: (number | null)[];
  courseId: string;
  chapterId: string;
}) {
  const correct = answers.filter((a, i) => a === questions[i].correctAnswer).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= 70;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Score card */}
        <div className="card p-8 text-center space-y-4">
          <div
            className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold ${
              passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {score}%
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{passed ? 'Félicitations !' : 'Continuez à pratiquer !'}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {correct} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''} sur {questions.length}
              {passed ? ' — Seuil de 70% atteint' : ' — Seuil de 70% requis'}
            </p>
          </div>

          {/* Score bar */}
          <div className="space-y-1">
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className={`h-3 rounded-full transition-all ${passed ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span className="text-gray-700 font-medium">70% requis</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Correction détaillée */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Correction détaillée</h3>
          <ul className="space-y-4">
            {questions.map((q, idx) => {
              const chosen = answers[idx];
              const isCorrect = chosen === q.correctAnswer;
              return (
                <li key={q.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isCorrect ? 'bg-green-500' : 'bg-red-400'
                      }`}
                    >
                      {isCorrect ? (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{q.question}</p>
                  </div>
                  {!isCorrect && (
                    <div className="ml-7 space-y-1 text-xs">
                      <p className="text-red-600">
                        Votre réponse : {chosen !== null ? q.options[chosen] : 'Non répondu'}
                      </p>
                      <p className="text-green-600">Bonne réponse : {q.options[q.correctAnswer]}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!passed && (
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex-1"
            >
              Recommencer le quiz
            </button>
          )}
          <Link href={`/cours/${courseId}/chapitre/${chapterId}`} className="btn-primary flex-1 text-center">
            {passed ? 'Continuer le cours' : 'Revoir le chapitre'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage({ params }: Props) {
  const course = mockCourses.find((c) => c.id === params.id);
  const chapter = course?.chapters.find((ch) => ch.quiz?.id === params.quizId);
  const quiz = chapter?.quiz;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    quiz ? Array(quiz.questions.length).fill(null) : []
  );
  const [quizState, setQuizState] = useState<QuizState>('answering');

  if (!course || !chapter || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Quiz introuvable.</p>
      </div>
    );
  }

  if (quizState === 'results') {
    return (
      <QuizResults
        questions={quiz.questions}
        answers={answers}
        courseId={course.id}
        chapterId={chapter.id}
      />
    );
  }

  const question = quiz.questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  function selectAnswer(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = optionIndex;
      return next;
    });
  }

  function goNext() {
    if (isLastQuestion) {
      setQuizState('results');
    } else {
      setCurrentQuestion((i) => i + 1);
    }
  }

  function goPrev() {
    if (currentQuestion > 0) setCurrentQuestion((i) => i - 1);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-4">
          <Link
            href={`/cours/${course.id}/chapitre/${chapter.id}`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>
          <div className="flex-1">
            <p className="text-xs text-gray-500 truncate">{quiz.title}</p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {currentQuestion + 1} / {quiz.questions.length}
          </span>
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl space-y-6">
          {/* Question card */}
          <div className="card p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-2">
                Question {currentQuestion + 1}
              </p>
              <h2 className="text-lg font-semibold text-gray-900 leading-snug">{question.question}</h2>
            </div>

            {/* Options */}
            <ul className="space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                return (
                  <li key={idx}>
                    <button
                      onClick={() => selectAnswer(idx)}
                      className={`w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-900 font-medium'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Option letter */}
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentQuestion === 0}
              className="btn-secondary disabled:opacity-30 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Précédent
            </button>

            <div className="flex gap-1.5">
              {quiz.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentQuestion
                      ? 'w-6 bg-primary-500'
                      : answers[idx] !== null
                      ? 'w-2 bg-primary-300'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              disabled={selectedAnswer === null}
              className="btn-primary disabled:opacity-30 flex items-center gap-2"
            >
              {isLastQuestion ? 'Voir les résultats' : 'Suivant'}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
