"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  Layers,
  Plus,
  Play,
  RotateCw,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
  HelpCircle,
  Eye,
  ArrowRight,
  BookOpen,
  Clock,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { flashcardsApi, subjectsApi } from "@/lib/api";
import { Flashcard } from "@/types";

export default function FlashcardsPage() {
  const queryClient = useQueryClient();

  // Mode: "deck" (management) or "review" (active review session)
  const [mode, setMode] = useState<"deck" | "review">("deck");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("");

  // Review session state
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // New Flashcard Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");

  // Queries
  const { data: flashcards = [] } = useQuery({
    queryKey: ["flashcards", selectedSubjectFilter],
    queryFn: () => flashcardsApi.list({ subject_id: selectedSubjectFilter || undefined }),
  });

  const { data: dueCards = [] } = useQuery({
    queryKey: ["dueFlashcards"],
    queryFn: () => flashcardsApi.getDue(),
  });

  const { data: dueSummary } = useQuery({
    queryKey: ["flashcardSummary"],
    queryFn: () => flashcardsApi.getSummary(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: flashcardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["dueFlashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcardSummary"] });
      setShowCreateModal(false);
      setNewQuestion("");
      setNewAnswer("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: flashcardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["dueFlashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcardSummary"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      flashcardsApi.review(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["dueFlashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcardSummary"] });

      if (reviewIndex + 1 < dueCards.length) {
        setReviewIndex(reviewIndex + 1);
        setIsAnswerRevealed(false);
      } else {
        // Queue complete!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setMode("deck");
        setReviewIndex(0);
        setIsAnswerRevealed(false);
      }
    },
  });

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim() || !newSubjectId) return;
    createMutation.mutate({
      subject_id: newSubjectId,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    });
  };

  const currentDueCard = dueCards[reviewIndex];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <Layers className="w-3.5 h-3.5" />
              SM-2 Spaced Repetition Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Flashcards & Revision
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Systematic expanding intervals mathematically proven to interrupt the forgetting curve.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {dueCards.length > 0 && mode === "deck" && (
              <button
                onClick={() => {
                  setReviewIndex(0);
                  setIsAnswerRevealed(false);
                  setMode("review");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
              >
                <Play className="w-4 h-4 fill-current" />
                Review {dueCards.length} Due Cards
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
            >
              <Plus className="w-4 h-4" />
              New Flashcard
            </button>
          </div>
        </div>

        {/* ------------------ ACTIVE REVIEW MODE ------------------ */}
        {mode === "review" && currentDueCard ? (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-indigo-600">
                Card {reviewIndex + 1} of {dueCards.length}
              </span>
              <button
                onClick={() => setMode("deck")}
                className="hover:text-slate-800 font-medium"
              >
                Exit Review Mode
              </button>
            </div>

            {/* Flashcard Component */}
            <div
              onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
              className="bg-white min-h-[300px] p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between text-center cursor-pointer hover:border-indigo-300 transition group select-none relative"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span
                  className="font-semibold px-2 py-0.5 rounded-full text-white text-[10px]"
                  style={{
                    backgroundColor: currentDueCard.subject_colour || "#6366f1",
                  }}
                >
                  {currentDueCard.subject_name || "General"}
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <RotateCw className="w-3 h-3" />
                  Repetition #{currentDueCard.repetitions}
                </span>
              </div>

              <div className="my-6">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed">
                  {currentDueCard.question}
                </p>

                {isAnswerRevealed ? (
                  <div className="mt-6 pt-6 border-t border-slate-100 text-base sm:text-lg text-indigo-700 font-medium leading-relaxed animate-in fade-in">
                    {currentDueCard.answer}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5 font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    Click anywhere to reveal answer
                  </p>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                Current Ease Factor: {currentDueCard.ease_factor.toFixed(2)}
              </div>
            </div>

            {/* SM-2 Quality Feedback Buttons */}
            {isAnswerRevealed ? (
              <div className="space-y-3">
                <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  How smoothly did you recall this answer?
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { rating: 0, label: "Blackout", desc: "1d", color: "bg-rose-50 text-rose-700 border-rose-200" },
                    { rating: 1, label: "Wrong", desc: "1d", color: "bg-rose-50 text-rose-700 border-rose-200" },
                    { rating: 2, label: "Hard", desc: "1d", color: "bg-amber-50 text-amber-700 border-amber-200" },
                    { rating: 3, label: "Hesitant", desc: "+1d", color: "bg-blue-50 text-blue-700 border-blue-200" },
                    { rating: 4, label: "Good", desc: "+6d", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                    { rating: 5, label: "Perfect", desc: "Easy", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  ].map((btn) => (
                    <button
                      key={btn.rating}
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: currentDueCard.id,
                          rating: btn.rating,
                        })
                      }
                      className={`p-3 rounded-2xl border text-center transition hover:scale-105 active:scale-95 ${btn.color}`}
                    >
                      <div className="text-xs font-bold">{btn.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{btn.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* ------------------ DECK MANAGEMENT VIEW ------------------ */
          <div className="space-y-6">
            {/* Due Queue Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled Recall Status
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mt-1">
                  {dueCards.length > 0
                    ? `You have ${dueCards.length} flashcards ready for review today!`
                    : "All caught up! Zero cards overdue right now."}
                </h2>
                <p className="text-xs text-indigo-100 mt-1">
                  Total deck size: {flashcards.length} cards across {subjects.length} subjects.
                </p>
              </div>

              {dueCards.length > 0 && (
                <button
                  onClick={() => {
                    setReviewIndex(0);
                    setIsAnswerRevealed(false);
                    setMode("review");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition shadow-sm shrink-0"
                >
                  Start Recall Sprint
                </button>
              )}
            </div>

            {/* Deck Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">
                Filter by Subject:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedSubjectFilter("")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedSubjectFilter === ""
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Subjects
                </button>
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectFilter(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedSubjectFilter === sub.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Flashcards Grid */}
            {flashcards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {flashcards.map((card) => {
                  const isDue = new Date(card.next_review_at) <= new Date();
                  return (
                    <div
                      key={card.id}
                      className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{
                              backgroundColor: card.subject_colour || "#6366f1",
                            }}
                          >
                            {card.subject_name || "General"}
                          </span>
                          <div className="flex items-center gap-1">
                            {isDue && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                Due Today
                              </span>
                            )}
                            <button
                              onClick={() => {
                                if (confirm("Delete this flashcard?")) {
                                  deleteMutation.mutate(card.id);
                                }
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">
                          {card.question}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {card.answer}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Interval: {card.interval_days}d</span>
                        <span>Ease: {card.ease_factor.toFixed(2)}</span>
                        <span>Reps: {card.repetitions}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Your flashcard deck is empty
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                  Create your first question-and-answer pair to begin scheduled spaced repetition reviews.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Flashcard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Flashcard Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Create Flashcard
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Atomic question and answer pair scheduled with the SM-2 algorithm.
              </p>

              <form onSubmit={handleCreateCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subject Course
                  </label>
                  <select
                    required
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Course</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Question / Prompt
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. What is the derivative of sin(x)?"
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Answer / Explanation
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="e.g. cos(x)"
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                  >
                    Save Flashcard
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
