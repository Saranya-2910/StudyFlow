"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Star,
  Sparkles,
  BookOpen,
  CalendarCheck,
  Headphones,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { sessionsApi, techniquesApi, subjectsApi, tasksApi } from "@/lib/api";
import { Technique, StudySession } from "@/types";
import {
  playTimerCompletionSound,
  playPauseResumeSound,
  ambientSound,
  AmbientSoundType,
} from "@/lib/sound";

function FocusRoomContent() {
  const searchParams = useSearchParams();
  const preselectedTaskId = searchParams.get("task_id");
  const preselectedTechSlug = searchParams.get("technique");

  const queryClient = useQueryClient();

  // Mode Selection
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(25);
  const [selectedTechniqueSlug, setSelectedTechniqueSlug] = useState<string>("pomodoro");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>(preselectedTaskId || "");
  const [sessionNotes, setSessionNotes] = useState<string>("");

  // Controls & States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [justCompletedSessionId, setJustCompletedSessionId] = useState<string | null>(null);
  const [concentrationRating, setConcentrationRating] = useState<number>(5);
  const [completionNotes, setCompletionNotes] = useState<string>("");

  // Ambient sound state
  const [ambientType, setAmbientType] = useState<AmbientSoundType>("none");
  const [ambientVol, setAmbientVol] = useState<number>(0.5);

  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  const handleAmbientChange = (type: AmbientSoundType) => {
    setAmbientType(type);
    if (type === "none") {
      ambientSound.stop();
    } else {
      ambientSound.play(type);
    }
  };

  const handleAmbientVolumeChange = (vol: number) => {
    setAmbientVol(vol);
    ambientSound.setVolume(vol);
  };

  // Authoritative dynamic seconds remaining
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);

  // Queries
  const { data: techniques = [] } = useQuery({
    queryKey: ["techniques"],
    queryFn: () => techniquesApi.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list({ status: "pending" }),
  });

  const { data: activeSession, refetch: refetchActive } = useQuery({
    queryKey: ["activeSession"],
    queryFn: () => sessionsApi.getActive(),
    refetchInterval: 5000,
  });

  // Automatically sync preselected parameters
  useEffect(() => {
    if (preselectedTechSlug) {
      setSelectedTechniqueSlug(preselectedTechSlug);
      const tech = techniques.find((t) => t.slug === preselectedTechSlug);
      if (tech?.default_configuration?.focus_minutes) {
        setSelectedDurationMinutes(tech.default_configuration.focus_minutes);
      }
    }
  }, [preselectedTechSlug, techniques]);

  useEffect(() => {
    if (preselectedTaskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === preselectedTaskId);
      if (task) {
        setSelectedTaskId(task.id);
        if (task.subject_id) setSelectedSubjectId(task.subject_id);
      }
    }
  }, [preselectedTaskId, tasks]);

  // Authoritative timestamp tick effect
  useEffect(() => {
    if (!activeSession) {
      setSecondsRemaining(selectedDurationMinutes * 60);
      return;
    }

    const calculateRemaining = () => {
      const planned = activeSession.planned_duration;
      const started = new Date(activeSession.started_at).getTime() / 1000;
      const pausedSeconds = activeSession.paused_duration || 0;

      let elapsed = 0;
      if (activeSession.status === "running") {
        const now = Date.now() / 1000;
        elapsed = Math.max(0, now - started - pausedSeconds);
      } else if (activeSession.status === "paused" && activeSession.paused_at) {
        const pausedAt = new Date(activeSession.paused_at).getTime() / 1000;
        elapsed = Math.max(0, pausedAt - started - pausedSeconds);
      }

      const remaining = Math.max(0, Math.round(planned - elapsed));
      setSecondsRemaining(remaining);

      // Handle natural completion
      if (remaining === 0 && activeSession.status === "running") {
        handleCompleteSession();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeSession, selectedDurationMinutes]);

  // Mutations
  const startMutation = useMutation({
    mutationFn: sessionsApi.start,
    onSuccess: (session) => {
      queryClient.setQueryData(["activeSession"], session);
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: sessionsApi.pause,
    onSuccess: (session) => {
      if (soundEnabled) playPauseResumeSound(true);
      queryClient.setQueryData(["activeSession"], session);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: sessionsApi.resume,
    onSuccess: (session) => {
      if (soundEnabled) playPauseResumeSound(false);
      queryClient.setQueryData(["activeSession"], session);
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) =>
      sessionsApi.complete(id, data),
    onSuccess: (session) => {
      if (soundEnabled) playTimerCompletionSound();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setJustCompletedSessionId(session.id);
      setShowCompletionModal(true);
      setCycleCount((c) => c + 1);
      queryClient.setQueryData(["activeSession"], null);
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      queryClient.invalidateQueries({ queryKey: ["activeTasks"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: sessionsApi.cancel,
    onSuccess: () => {
      queryClient.setQueryData(["activeSession"], null);
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });

  // Action Handlers
  const handleStart = () => {
    const tech = techniques.find((t) => t.slug === selectedTechniqueSlug) || techniques[0];
    if (!tech) return;

    startMutation.mutate({
      technique_id: tech.id,
      planned_duration: selectedDurationMinutes * 60,
      subject_id: selectedSubjectId || undefined,
      task_id: selectedTaskId || undefined,
      notes: sessionNotes || undefined,
    });
  };

  const handlePause = () => {
    if (activeSession) pauseMutation.mutate(activeSession.id);
  };

  const handleResume = () => {
    if (activeSession) resumeMutation.mutate(activeSession.id);
  };

  const handleCompleteSession = () => {
    if (activeSession) {
      completeMutation.mutate({ id: activeSession.id });
    }
  };

  const handleCancel = () => {
    if (activeSession && confirm("Are you sure you want to cancel this focus session?")) {
      cancelMutation.mutate(activeSession.id);
    }
  };

  const submitFeedback = async () => {
    if (justCompletedSessionId) {
      await sessionsApi.complete(justCompletedSessionId, {
        concentration_rating: concentrationRating,
        notes: completionNotes || undefined,
      });
    }
    setShowCompletionModal(false);
    setJustCompletedSessionId(null);
    setCompletionNotes("");
    queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Format mm:ss
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Progress percentage
  const totalPlanned = activeSession ? activeSession.planned_duration : selectedDurationMinutes * 60;
  const progressPct = totalPlanned > 0 ? Math.round(((totalPlanned - secondsRemaining) / totalPlanned) * 100) : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Preset Modes Selector (Only available when idle) */}
        {!activeSession && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-2">
              Preset Modes:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Pomodoro (25m)", slug: "pomodoro", mins: 25 },
                { label: "52 / 17 (52m)", slug: "52-17", mins: 52 },
                { label: "Deep Work (60m)", slug: "deep-work", mins: 60 },
                { label: "Short Sprint (15m)", slug: "custom-timer", mins: 15 },
              ].map((preset) => {
                const isActive = selectedTechniqueSlug === preset.slug && selectedDurationMinutes === preset.mins;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSelectedTechniqueSlug(preset.slug);
                      setSelectedDurationMinutes(preset.mins);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ambient Focus Audio Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Focus Noise:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "none", label: "Mute" },
              { id: "brown_noise", label: "Brown Noise" },
              { id: "rain", label: "Rain" },
              { id: "binaural_beat", label: "40Hz Gamma Beat" },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => handleAmbientChange(snd.id as AmbientSoundType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  ambientType === snd.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {ambientType !== "none" && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={ambientVol}
                onChange={(e) => handleAmbientVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                title="Ambient Volume"
              />
              <span>{Math.round(ambientVol * 100)}%</span>
            </div>
          )}
        </div>

        {/* Central Focus Display Card */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Top toolbar */}
          <div className="w-full flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                Cycle #{cycleCount}
              </span>
              {activeSession && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {activeSession.status === "paused" ? "Paused" : "Focusing"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute chimes" : "Enable chimes"}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleFullscreen}
                title="Fullscreen mode"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Large Authoritative Countdown Clock */}
          <div className="relative my-4 flex flex-col items-center justify-center">
            <div className="text-7xl sm:text-9xl font-black tracking-tight text-slate-900 font-mono select-none">
              {timeFormatted}
            </div>
            <p className="text-sm font-semibold text-slate-400 mt-2">
              {activeSession ? activeSession.technique_name : "Ready to start"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md bg-slate-100 h-2.5 rounded-full overflow-hidden my-6">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 mt-2">
            {!activeSession ? (
              <button
                onClick={handleStart}
                disabled={startMutation.isPending}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Focus
              </button>
            ) : activeSession.status === "running" ? (
              <>
                <button
                  onClick={handlePause}
                  disabled={pauseMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition shadow-md shadow-amber-100"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </button>
                <button
                  onClick={handleCompleteSession}
                  disabled={completeMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Early
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Cancel session"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleResume}
                  disabled={resumeMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Resume
                </button>
                <button
                  onClick={handleCompleteSession}
                  disabled={completeMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Cancel session"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task and Subject Association (When Idle) */}
        {!activeSession && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Subject / Task Selector */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                Session Focus Linking
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Link to Subject (Optional)
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">General / No Specific Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Link to Task (Optional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    const t = tasks.find((item) => item.id === e.target.value);
                    if (t?.subject_id) setSelectedSubjectId(t.subject_id);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Specific Task</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.subject_name ? `(${t.subject_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Duration & Notes */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Custom Duration & Notes
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Focus Minutes ({selectedDurationMinutes}m)
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={selectedDurationMinutes}
                  onChange={(e) => setSelectedDurationMinutes(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>5m</span>
                  <span>25m</span>
                  <span>50m</span>
                  <span>90m</span>
                  <span>120m</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Solve Chapter 4 calculus practice problems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Post-Session Feedback Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Session Completed! 🎉
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Great job! How was your focus and concentration during this block?
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setConcentrationRating(star)}
                    className="p-1.5 text-slate-300 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= concentrationRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-left mb-5">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Key Learnings or Notes
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="What did you achieve? Any concepts to review later?"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={submitFeedback}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function FocusRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FocusRoomContent />
    </Suspense>
  );
}
