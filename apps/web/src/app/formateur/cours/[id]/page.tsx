'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockCourses } from '@/lib/mock-data';
import type { Lesson } from '@/lib/types';

interface Props {
  params: { id: string };
}

const LEVELS = [
  { value: 'DEBUTANT', label: 'Débutant' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
  { value: 'AVANCE', label: 'Avancé' },
];

const CATEGORIES_OPTIONS = [
  'Développement Web',
  'Data Science',
  'DevOps',
  'Mobile',
  'Cybersécurité',
  'Design',
];

function LessonRow({
  lesson,
  index,
  onRemove,
}: {
  lesson: Lesson;
  index: number;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-white">
        {/* Drag handle */}
        <svg className="h-4 w-4 text-gray-300 shrink-0 cursor-grab" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span className="uppercase">{lesson.type}</span>
            {lesson.url && <span className="text-primary-500 truncate max-w-[120px]">{lesson.url}</span>}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <button
          onClick={() => onRemove(lesson.id)}
          className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre de la leçon</label>
              <input type="text" defaultValue={lesson.title} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select defaultValue={lesson.type} className="input text-sm">
                <option value="VIDEO">Vidéo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL de la vidéo</label>
            <input type="url" placeholder="https://..." defaultValue={lesson.url ?? ''} className="input text-sm" />
          </div>
          <div className="flex justify-end">
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Sauvegarder</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseEditorPage({ params }: Props) {
  const existingCourse = mockCourses.find((c) => c.id === params.id);
  const isNew = params.id === 'nouveau';

  // Flatten all lessons from existing course for editing
  const initialLessons: Lesson[] = existingCourse
    ? existingCourse.modules.flatMap((m) => m.lessons)
    : [];

  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [saved, setSaved] = useState(false);

  function removeLesson(id: string) {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }

  function addLesson() {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: `Nouvelle leçon ${lessons.length + 1}`,
      type: 'VIDEO',
      order: lessons.length + 1,
      moduleId: 'default',
    };
    setLessons((prev) => [...prev, newLesson]);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/formateur" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">
              {isNew ? 'Nouveau cours' : existingCourse?.title ?? 'Éditer le cours'}
            </p>
            {!isNew && existingCourse && (
              <span className={`badge ${existingCourse.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {existingCourse.published ? 'Publié' : 'Brouillon'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs px-3 py-1.5">Aperçu</button>
            <button
              onClick={handleSave}
              className={`btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {saved ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Sauvegardé
                </>
              ) : (
                'Sauvegarder'
              )}
            </button>
            {!existingCourse?.published && (
              <button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
                Publier
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Course info */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Basic info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Informations générales</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du cours *</label>
                <input
                  type="text"
                  defaultValue={existingCourse?.title ?? ''}
                  placeholder="ex: JavaScript Moderne — ES2024"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  defaultValue={existingCourse?.description ?? ''}
                  placeholder="Décrivez votre cours en quelques phrases…"
                  className="input resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select className="input" defaultValue={existingCourse?.category ?? ''}>
                    <option value="">Choisir…</option>
                    {CATEGORIES_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <select className="input" defaultValue={existingCourse?.level ?? 'DEBUTANT'}>
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={existingCourse?.price ?? 0}
                    className="input"
                  />
                </div>
              </div>

              {/* Thumbnail upload placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image de couverture</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
                  <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p className="text-sm text-gray-400">Cliquez pour uploader ou glissez-déposez</p>
                  <p className="text-xs text-gray-300 mt-1">PNG, JPG — 16:9 recommandé</p>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Leçons{' '}
                  <span className="text-sm font-normal text-gray-400">({lessons.length})</span>
                </h2>
                <button onClick={addLesson} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Ajouter une leçon
                </button>
              </div>

              {lessons.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-gray-400">
                  <p className="text-sm mb-3">Aucune leçon pour l&apos;instant.</p>
                  <button onClick={addLesson} className="btn-primary text-xs">
                    Créer la première leçon
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      index={idx}
                      onRemove={removeLesson}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                Glissez-déposez les leçons pour les réordonner
              </p>
            </div>
          </div>

          {/* Right — Settings sidebar */}
          <div className="lg:w-72 shrink-0 space-y-5">
            {/* Publish settings */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Publication</h3>

              <div className="space-y-2">
                {[
                  { label: 'Titre renseigné', done: true },
                  { label: 'Description complétée', done: true },
                  { label: 'Image de couverture', done: false },
                  { label: 'Au moins 1 leçon', done: lessons.length > 0 },
                ].map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                        check.done ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
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

              <button
                disabled={lessons.length === 0}
                className="btn-primary w-full text-sm disabled:opacity-40"
              >
                Publier le cours
              </button>
            </div>

            {/* Danger zone */}
            <div className="card p-5 space-y-3 border-red-100">
              <h3 className="font-semibold text-gray-900 text-sm">Zone dangereuse</h3>
              <button className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
