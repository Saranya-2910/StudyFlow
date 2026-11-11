"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  Star,
  BookOpen,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { revisionsApi, subjectsApi } from "@/lib/api";
import { Revision, Subject, Topic } from "@/types";

export default function RevisionsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  // New Revision Form
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [spacingDays, setSpacingDays] = useState<number>(3);
  const [scheduleNotes, setScheduleNotes] = useState<string>("");

  // Complete Rating Form
  const [recallRating, setRecallRating] = useState<number>(4);
  const [completionNotes, setCompletionNotes] = useState<string>("");

  // Queries
  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ["revisions", statusFilter],
    queryFn: () =>
      revisionsApi.list(statusFilter === "all" ? undefined : statusFilter),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list(),
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["topics", selectedSubjectId],
    queryFn: () =>
      selectedSubjectId ? subjectsApi.listTopics(selectedSubjectId) : Promise.resolve([]),
    enabled: !!selectedSubjectId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: revisionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions"] });
      setShowScheduleModal(false);
      setSelectedTopicId("");
      setScheduleNotes("");
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { recall_rating: number; notes?: string } }) =>
      revisionsApi.complete(id, data),
    onSuccess: () => {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      queryClient.invalidateQueries({ queryKey: ["revisions"] });
      setShowRatingModal(false);
      setSelectedRevisionId(null);
      setCompletionNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: revisionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions"] });
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) return;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + spacingDays);

    createMutation.mutate({
      topic_id: selectedTopicId,
      scheduled_at: scheduledDate.toISOString(),
      notes: scheduleNotes || undefined,
    });
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevisionId) return;

    completeMutation.mutate({
      id: selectedRevisionId,
      data: {
        recall_rating: recallRating,
        notes: completionNotes || undefined,
      },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Spaced Topic Recall
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Revision Calendar & Queue
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review topics at optimal intervals (Day 1, 3, 7, 14, 30) to secure long-term conceptual retention.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Schedule Topic Revision
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "All Revisions" },
              { id: "scheduled", label: "Upcoming / Due" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {revisions.length} records
          </span>
        </div>

        {/* Revision Queue List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          {revisions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {revisions.map((rev) => {
                const isDue = new Date(rev.scheduled_at) <= new Date();
                return (
                  <div
                    key={rev.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/50 px-2 rounded-xl transition"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          rev.status === "completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : isDue
                            ? "bg-amber-50 text-amber-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {rev.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <RotateCw className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {rev.subject_name && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{
                                backgroundColor: rev.subject_colour || "#6366f1",
                              }}
                            >
                              {rev.subject_name}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {rev.topic_title || "Topic Revision"}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {rev.status === "completed"
                              ? `Completed on ${new Date(rev.completed_at!).toLocaleDateString()}`
                              : `Scheduled for ${new Date(rev.scheduled_at).toLocaleDateString()}`}
                          </span>
                          {rev.notes && <span className="truncate">"{rev.notes}"</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {rev.status === "completed" ? (
                        <div className="flex items-center text-amber-400 bg-amber-50 px-2.5 py-1 rounded-xl">
                          {[...Array(rev.recall_rating || 0)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRevisionId(rev.id);
                            setShowRatingModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Done & Rate
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm("Delete this revision schedule?")) {
                            deleteMutation.mutate(rev.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No topic revisions scheduled
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Schedule intervals (e.g. Day 1, 3, 7, 14, 30) for your course topics to defeat the forgetting curve.
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule First Revision
              </button>
            </div>
          )}
        </div>

        {/* Schedule Revision Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Schedule Topic Revision
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Set a systematic recall checkpoint for a topic.
              </p>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Subject
                  </label>
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Choose Course Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Topic
                  </label>
                  <select
                    required
                    disabled={!selectedSubjectId}
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">
                      {selectedSubjectId ? "Choose Topic" : "First select a subject above"}
                    </option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Spaced Interval Preset
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { days: 1, label: "Day 1" },
                      { days: 3, label: "Day 3" },
                      { days: 7, label: "Day 7" },
                      { days: 14, label: "Day 14" },
                      { days: 30, label: "Day 30" },
                    ].map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => setSpacingDays(p.days)}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          spacingDays === p.days
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Revision Focus Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="e.g. Test formula derivations without textbook"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !selectedTopicId}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    Schedule Checkpoint
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rate Revision Recall Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Revision Completed!
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                How well were you able to recall this topic from pure memory?
              </p>

              <form onSubmit={handleRatingSubmit} className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRecallRating(star)}
                      className="p-1.5 text-slate-300 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= recallRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Key Takeaways & Concept Reflections
                  </label>
                  <textarea
                    rows={2}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="e.g. Solved problem 3 smoothly, review proof 2 again..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={completeMutation.isPending}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                  >
                    Save Rating
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
