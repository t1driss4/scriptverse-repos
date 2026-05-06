'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi, modulesApi, lessonsApi, quizApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type { Course, CourseModule, Lesson, Quiz, QuizQuestion } from '@/lib/types';
import { PageTransition } from '@/components/animations';

// ─── Constants ────────────────────────────────

const LEVELS = [
  { value: 'DEBUTANT', label: 'Débutant' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
  { value: 'AVANCE', label: 'Avancé' },
];

const CATEGORIES = [
  'Développement Web',
  'Data Science',
  'DevOps',
  'Mobile',
  'Cybersécurité',
  'Design',
];

interface Props {
  params: { id: string };
}

// ─── Sub-components ────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-sm">
      <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H5.75c-1.73 0-2.813-1.874-1.948-3.374L10.05 3.378c.866-1.5 3.032-1.5 3.898 0l5.355 9.748ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <span className="flex-1 text-red-700">{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-1">✕</button>
    </div>
  );
}

// ─── Quiz Question Editor ─────────────────────

function QuestionEditor({
  question,
  index,
  moduleId,
  token,
  onUpdated,
  onRemoved,
}: {
  question: QuizQuestion;
  index: number;
  moduleId: string;
  token: string;
  onUpdated: (q: QuizQuestion) => void;
  onRemoved: (id: string) => void;
}) {
  const [text, setText] = useState(question.question);
  const [options, setOptions] = useState<string[]>(question.options);
  const [correct, setCorrect] = useState(question.correctAnswer);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function save() {
    if (!text.trim() || options.some((o) => !o.trim())) return;
    setSaving(true);
    try {
      const updated = await quizApi.updateQuestion(token, moduleId, question.id, {
        question: text,
        options,
        correctAnswer: correct,
      });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      await quizApi.removeQuestion(token, moduleId, question.id);
      onRemoved(question.id);
    } finally {
      setRemoving(false);
    }
  }

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question {index + 1}</span>
        <button
          onClick={remove}
          disabled={removing}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
        >
          {removing ? '…' : 'Supprimer'}
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Intitulé</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input text-sm"
          placeholder="Quelle est la question ?"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Options (cochez la bonne réponse)</label>
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={correct === i}
                onChange={() => setCorrect(i)}
                className="accent-primary-600"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="input text-sm flex-1"
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <button
                  onClick={() => {
                    const next = options.filter((_, idx) => idx !== i);
                    setOptions(next);
                    if (correct >= next.length) setCorrect(next.length - 1);
                  }}
                  className="text-gray-300 hover:text-red-400 p-0.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 5 && (
          <button
            onClick={() => setOptions((prev) => [...prev, ''])}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            + Ajouter une option
          </button>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Panel ────────────────────────────────

function QuizPanel({
  moduleId,
  token,
}: {
  moduleId: string;
  token: string;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [removingQuiz, setRemovingQuiz] = useState(false);
  const [addingQ, setAddingQ] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const q = await quizApi.findByModule(moduleId);
      setQuiz(q);
    } catch {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  async function createQuiz() {
    if (!quizTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const q = await quizApi.create(token, moduleId, { title: quizTitle });
      setQuiz(q);
      setQuizTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCreating(false);
    }
  }

  async function deleteQuiz() {
    if (!quiz) return;
    setRemovingQuiz(true);
    try {
      await quizApi.remove(token, moduleId);
      setQuiz(null);
    } finally {
      setRemovingQuiz(false);
    }
  }

  async function addQuestion() {
    if (!quiz) return;
    setAddingQ(true);
    setError(null);
    try {
      const q = await quizApi.addQuestion(token, moduleId, {
        question: 'Nouvelle question',
        options: ['Option A', 'Option B'],
        correctAnswer: 0,
        order: (quiz.questions?.length ?? 0) + 1,
      });
      setQuiz((prev) => prev ? { ...prev, questions: [...(prev.questions ?? []), q] } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAddingQ(false);
    }
  }

  function handleQuestionUpdated(updated: QuizQuestion) {
    setQuiz((prev) =>
      prev
        ? { ...prev, questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)) }
        : prev,
    );
  }

  function handleQuestionRemoved(id: string) {
    setQuiz((prev) =>
      prev ? { ...prev, questions: prev.questions.filter((q) => q.id !== id) } : prev,
    );
  }

  if (loading) return <div className="skeleton h-20 rounded-lg" />;

  if (!quiz) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center space-y-3">
        <p className="text-sm text-gray-500">Aucun quiz pour ce module.</p>
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        <div className="flex items-center gap-2 max-w-xs mx-auto">
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Titre du quiz…"
            className="input text-sm flex-1"
            onKeyDown={(e) => e.key === 'Enter' && createQuiz()}
          />
          <button
            onClick={createQuiz}
            disabled={creating || !quizTitle.trim()}
            className="btn-primary text-xs px-3 py-1.5 shrink-0 disabled:opacity-40"
          >
            {creating ? '…' : 'Créer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{quiz.title}</span>
          <span className="badge bg-amber-50 text-amber-700">{quiz.questions?.length ?? 0} question{(quiz.questions?.length ?? 0) !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={deleteQuiz}
          disabled={removingQuiz}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
        >
          {removingQuiz ? '…' : 'Supprimer le quiz'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="space-y-2">
        {(quiz.questions ?? []).map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            moduleId={moduleId}
            token={token}
            onUpdated={handleQuestionUpdated}
            onRemoved={handleQuestionRemoved}
          />
        ))}
      </div>

      <button
        onClick={addQuestion}
        disabled={addingQ}
        className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-40"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {addingQ ? 'Ajout…' : 'Ajouter une question'}
      </button>
    </div>
  );
}

// ─── Lesson Row ────────────────────────────────

function LessonRow({
  lesson,
  index,
  moduleId: _moduleId,
  token,
  onUpdated,
  onRemoved,
}: {
  lesson: Lesson;
  index: number;
  moduleId: string;
  token: string;
  onUpdated: (l: Lesson) => void;
  onRemoved: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [url, setUrl] = useState(lesson.url ?? '');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await lessonsApi.update(token, lesson.id, { title, url: url || undefined });
      onUpdated(updated);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      await lessonsApi.remove(token, lesson.id);
      onRemoved(lesson.id);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-white">
        <svg className="h-4 w-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
          {lesson.url && (
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{lesson.url}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-gray-400 hover:text-gray-600 p-1"
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={remove}
          disabled={removing}
          className="shrink-0 text-gray-300 hover:text-red-500 p-1 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="input text-sm" defaultValue="VIDEO" disabled>
                <option value="VIDEO">Vidéo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL de la vidéo</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="input text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
            <button onClick={save} disabled={saving || !title.trim()} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40">
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module Panel ──────────────────────────────

function ModulePanel({
  mod,
  token,
  onUpdated,
  onRemoved,
}: {
  mod: CourseModule;
  token: string;
  onUpdated: (m: CourseModule) => void;
  onRemoved: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(mod.title);
  const [lessons, setLessons] = useState<Lesson[]>(mod.lessons ?? []);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');
  const [savingTitle, setSavingTitle] = useState(false);
  const [removingMod, setRemovingMod] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);

  async function saveTitle() {
    if (!title.trim()) return;
    setSavingTitle(true);
    try {
      const updated = await modulesApi.update(token, mod.id, { title });
      onUpdated({ ...mod, title: updated.title });
      setEditingTitle(false);
    } finally {
      setSavingTitle(false);
    }
  }

  async function removeModule() {
    setRemovingMod(true);
    try {
      await modulesApi.remove(token, mod.id);
      onRemoved(mod.id);
    } finally {
      setRemovingMod(false);
    }
  }

  async function addLesson() {
    setAddingLesson(true);
    try {
      const newLesson = await lessonsApi.create(token, mod.id, {
        title: `Leçon ${lessons.length + 1}`,
        type: 'VIDEO',
        order: lessons.length + 1,
      });
      setLessons((prev) => [...prev, newLesson]);
    } finally {
      setAddingLesson(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Module header */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
        <svg className="h-4 w-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-xs font-bold">
          {mod.order}
        </div>

        {editingTitle ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-sm flex-1"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            />
            <button onClick={saveTitle} disabled={savingTitle || !title.trim()} className="btn-primary text-xs px-2 py-1 disabled:opacity-40">
              {savingTitle ? '…' : 'OK'}
            </button>
            <button onClick={() => { setTitle(mod.title); setEditingTitle(false); }} className="text-xs text-gray-400">✕</button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
            <p className="text-xs text-gray-400">{lessons.length} leçon{lessons.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {!editingTitle && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditingTitle(true)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors" title="Renommer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button onClick={() => setExpanded((v) => !v)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <button onClick={removeModule} disabled={removingMod} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50" title="Supprimer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-gray-100 pb-3">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'lessons' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Leçons ({lessons.length})
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'quiz' ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Quiz
            </button>
          </div>

          {activeTab === 'lessons' && (
            <div className="space-y-2">
              {lessons.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
                  Aucune leçon. Ajoutez la première !
                </div>
              ) : (
                lessons.map((lesson, idx) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    moduleId={mod.id}
                    token={token}
                    onUpdated={(updated) =>
                      setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
                    }
                    onRemoved={(id) =>
                      setLessons((prev) => prev.filter((l) => l.id !== id))
                    }
                  />
                ))
              )}
              <button
                onClick={addLesson}
                disabled={addingLesson}
                className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 w-full justify-center disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {addingLesson ? 'Ajout…' : 'Ajouter une leçon'}
              </button>
            </div>
          )}

          {activeTab === 'quiz' && (
            <QuizPanel moduleId={mod.id} token={token} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────

export default function CourseEditorPage({ params }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isNew = params.id === 'nouveau';

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingModule, setAddingModule] = useState(false);

  // Course form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('DEBUTANT');
  const [price, setPrice] = useState(0);

  const token = getAccessToken() ?? '';

  const loadCourse = useCallback(async () => {
    if (isNew || !params.id) return;
    try {
      setError(null);
      const data = await coursesApi.findMyOne(token, params.id);
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category ?? '');
      setLevel(data.level);
      setPrice(data.price);
      setModules(data.modules ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [params.id, isNew, token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'FORMATEUR') {
        router.replace('/');
        return;
      }
      loadCourse();
    }
  }, [authLoading, user, router, loadCourse]);

  async function handleSave() {
    if (!title.trim() || !description.trim()) {
      setError('Titre et description sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { title, description, category: category || undefined, level, price };
      if (isNew) {
        const created = await coursesApi.create(token, payload);
        router.replace(`/formateur/cours/${created.id}`);
      } else if (course) {
        const updated = await coursesApi.update(token, course.id, payload);
        setCourse((prev) => (prev ? { ...prev, ...updated } : prev));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle() {
    if (!course) return;
    setPublishing(true);
    setError(null);
    try {
      const updated = await coursesApi.update(token, course.id, { published: !course.published });
      setCourse((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!course) return;
    setDeleting(true);
    try {
      await coursesApi.remove(token, course.id);
      router.replace('/formateur');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleAddModule() {
    if (!course) return;
    setAddingModule(true);
    setError(null);
    try {
      const newMod = await modulesApi.create(token, course.id, {
        title: `Module ${modules.length + 1}`,
        order: modules.length + 1,
      });
      setModules((prev) => [...prev, { ...newMod, lessons: newMod.lessons ?? [] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du module');
    } finally {
      setAddingModule(false);
    }
  }

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);
  const readyToPublish = title.trim() !== '' && description.trim() !== '' && totalLessons > 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white h-14" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="card p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded" />
                ))}
              </div>
            </div>
            <div className="lg:w-72 space-y-5">
              <div className="card p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/formateur" className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="h-5 w-px bg-gray-200 shrink-0" />
            <p className="text-sm font-semibold text-gray-800 truncate">
              {isNew ? 'Nouveau cours' : title || 'Éditer le cours'}
            </p>
            {!isNew && course && (
              <span className={`badge shrink-0 ${course.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {course.published ? 'Publié' : 'Brouillon'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isNew && course && (
              <Link href={`/cours/${course.id}`} className="btn-secondary text-xs px-3 py-1.5">Aperçu</Link>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40 ${saved ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
            >
              {saved ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Sauvegardé
                </>
              ) : saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            {!isNew && course && (
              <button
                onClick={handlePublishToggle}
                disabled={publishing || (!course.published && !readyToPublish)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 ${
                  course.published
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {publishing ? '…' : course.published ? 'Dépublier' : 'Publier'}
              </button>
            )}
          </div>
        </div>
      </header>

      <PageTransition>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left — main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

              {/* Course info */}
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Informations générales</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre du cours *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex : JavaScript Moderne — ES2024"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre cours en quelques phrases…"
                    className="input resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                      <option value="">Choisir…</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                    <select value={level} onChange={(e) => setLevel(e.target.value)} className="input">
                      {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                    <input type="number" min={0} step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="input" />
                  </div>
                </div>

                {/* Thumbnail placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image de couverture</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
                    <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <p className="text-sm text-gray-400">Cliquez pour uploader (PNG, JPG — 16:9)</p>
                  </div>
                </div>
              </div>

              {/* Modules */}
              {!isNew && (
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">
                      Modules{' '}
                      <span className="text-sm font-normal text-gray-400">({modules.length})</span>
                    </h2>
                    <button
                      onClick={handleAddModule}
                      disabled={addingModule}
                      className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-40"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {addingModule ? 'Ajout…' : 'Ajouter un module'}
                    </button>
                  </div>

                  {modules.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
                      <p className="text-sm mb-3">Aucun module. Structurez votre cours !</p>
                      <button onClick={handleAddModule} disabled={addingModule} className="btn-primary text-xs">
                        Créer le premier module
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {modules.map((mod) => (
                        <ModulePanel
                          key={mod.id}
                          mod={mod}
                          token={token}
                          onUpdated={(updated) =>
                            setModules((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
                          }
                          onRemoved={(id) =>
                            setModules((prev) => prev.filter((m) => m.id !== id))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isNew && (
                <div className="card p-5 border-l-4 border-primary-400 bg-primary-50">
                  <p className="text-sm text-primary-800">
                    Sauvegardez d&apos;abord les informations de base pour accéder à la gestion des modules et leçons.
                  </p>
                </div>
              )}
            </div>

            {/* Right — sidebar */}
            <div className="lg:w-72 shrink-0 space-y-5">
              {/* Publication checklist */}
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm">Publication</h3>

                <div className="space-y-2">
                  {[
                    { label: 'Titre renseigné', done: title.trim() !== '' },
                    { label: 'Description complétée', done: description.trim() !== '' },
                    { label: 'Au moins 1 module', done: modules.length > 0 },
                    { label: 'Au moins 1 leçon', done: totalLessons > 0 },
                  ].map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-xs">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${check.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                        {check.done && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className={check.done ? 'text-gray-600' : 'text-gray-400'}>{check.label}</span>
                    </div>
                  ))}
                </div>

                {!isNew && course && (
                  <button
                    onClick={handlePublishToggle}
                    disabled={publishing || (!course.published && !readyToPublish)}
                    className={`w-full text-sm disabled:opacity-40 rounded-lg px-4 py-2 font-semibold transition-colors ${
                      course.published
                        ? 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'btn-primary'
                    }`}
                  >
                    {publishing ? '…' : course.published ? 'Dépublier le cours' : 'Publier le cours'}
                  </button>
                )}
              </div>

              {/* Stats */}
              {!isNew && (
                <div className="card p-5 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Statistiques</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Modules</span>
                      <span className="font-medium">{modules.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Leçons totales</span>
                      <span className="font-medium">{totalLessons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Apprenants</span>
                      <span className="font-medium">{(course?._count?.enrollments ?? 0).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger zone */}
              {!isNew && (
                <div className="card p-5 space-y-3 border-red-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Zone dangereuse</h3>
                  {confirmDelete ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-600">Cette action est irréversible. Confirmer ?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                        >
                          {deleting ? 'Suppression…' : 'Confirmer'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Supprimer définitivement
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
