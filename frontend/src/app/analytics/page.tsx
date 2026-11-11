"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Award,
  Flame,
  Zap,
  Target,
  Plus,
  Trash2,
  PieChart as PieIcon,
  Sparkles,
  TrendingUp,
  Layers,
  Download,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { analyticsApi, goalsApi } from "@/lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(14);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // New Goal Modal
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [goalType, setGoalType] = useState<string>("weekly_time");
  const [goalTarget, setGoalTarget] = useState<number>(300);
  const [goalPeriod, setGoalPeriod] = useState<string>("weekly");

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await analyticsApi.downloadCsv();
    } catch (err: any) {
      alert(err.message || "Failed to download study history CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  // Queries
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analyticsOverview", selectedTimeframe],
    queryFn: () => analyticsApi.getOverview(selectedTimeframe),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.list(),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => goalsApi.getAchievements(),
  });

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowGoalModal(false);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate({
      goal_type: goalType,
      target_value: Number(goalTarget),
      period: goalPeriod,
    });
  };

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Verified Performance Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Productivity Insights & Milestones
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Objective analytics calculated directly from your database records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
              title="Download authenticated study history as a structured CSV file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>

            {[
              { days: 7, label: "7 Days" },
              { days: 14, label: "14 Days" },
              { days: 30, label: "30 Days" },
            ].map((t) => (
              <button
                key={t.days}
                onClick={() => setSelectedTimeframe(t.days)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedTimeframe === t.days
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lifetime Stats KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Focus Time
              </span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {analytics ? Math.round(analytics.total_focus_minutes / 60) : 0} hrs
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {analytics ? analytics.total_focus_minutes : 0} verified minutes
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Focus Sprints
              </span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {analytics ? analytics.total_sessions_count : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Completed timer cycles</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Tasks Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {analytics ? analytics.total_tasks_completed : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">From academic planner</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Avg Concentration
              </span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {analytics && analytics.average_concentration_rating > 0
                ? `${analytics.average_concentration_rating} / 5`
                : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1">Subjective focus score</p>
          </div>
        </div>

        {/* Visual Charts: Focus Trend & Subject Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Focus Trend Area Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Focus Trend ({selectedTimeframe} Days)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actual recorded focus time in minutes per day
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {analytics && analytics.daily_focus_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.daily_focus_trend}>
                    <defs>
                      <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day_name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="m"
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} min`, "Focus Time"]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#focusGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No focus records for this timeframe.
                </div>
              )}
            </div>
          </div>

          {/* Subject Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Subject Breakdown
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Allocation of your total focus time
              </p>

              {analytics && analytics.subject_distribution.length > 0 ? (
                <div className="space-y-3">
                  {analytics.subject_distribution.map((sub, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sub.colour }}
                          />
                          {sub.subject_name}
                        </span>
                        <span className="text-slate-500">
                          {sub.minutes}m ({sub.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${sub.percentage}%`,
                            backgroundColor: sub.colour,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No subject focus recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technique Usage & Spaced Recall Accuracy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technique Usage Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Technique Usage Comparison
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Focus minutes distributed across your chosen productivity methods
            </p>

            {analytics && analytics.technique_usage.length > 0 ? (
              <div className="space-y-3">
                {analytics.technique_usage.map((tech, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {tech.technique_name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {tech.session_count} sessions completed
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                      {tech.total_minutes} min
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                No sessions completed yet.
              </div>
            )}
          </div>

          {/* Spaced Recall Performance */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Spaced Repetition Performance
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Measured recall accuracy from your SM-2 flashcard reviews
              </p>

              {analytics && analytics.recall_performance.total_reviews_count > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                      <div className="text-2xl font-black text-emerald-700">
                        {analytics.recall_performance.accuracy_percentage}%
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                        Recall Accuracy
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                      <div className="text-2xl font-black text-indigo-700">
                        {analytics.recall_performance.average_rating} / 5
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                        Average SM-2 Rating
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Total {analytics.recall_performance.total_reviews_count} flashcard reviews logged.
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Review cards in the Spaced Repetition centre to see measured retention metrics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Goals Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Study Goals & Habits
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set quantitative targets and track automatic progress from actual activity
              </p>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Goal
            </button>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {g.period}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm("Delete this goal?")) deleteGoalMutation.mutate(g.id);
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 capitalize mb-1">
                    {g.goal_type.replace("_", " ")}: {g.target_value}{" "}
                    {g.goal_type.includes("time") ? "mins" : "tasks"}
                  </h4>

                  <div className="my-2">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">
                        {g.current_value} / {g.target_value}
                      </span>
                      <span className="text-indigo-600">{g.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${g.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No active study goals set. Click "New Goal" to set a weekly focus or task target.
            </div>
          )}
        </div>

        {/* Verified Achievements Wall */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Achievements Wall
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {unlockedCount} / {achievements.length} Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Milestones automatically verified and unlocked from your genuine activity records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                  ach.is_unlocked
                    ? "bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200 shadow-sm shadow-indigo-50"
                    : "bg-slate-50/60 border-slate-200/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        ach.is_unlocked
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Award className="w-4 h-4" />
                    </div>
                    {ach.is_unlocked && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">{ach.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                {ach.is_unlocked && ach.unlocked_at && (
                  <span className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    Earned {new Date(ach.unlocked_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Create Study Goal
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Set a milestone target to measure your study consistency.
              </p>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Goal Metric
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="weekly_time">Weekly Focus Time (Minutes)</option>
                    <option value="daily_time">Daily Focus Time (Minutes)</option>
                    <option value="tasks_completed">Tasks Completed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Target Value
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Timeframe Period
                    </label>
                    <select
                      value={goalPeriod}
                      onChange={(e) => setGoalPeriod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createGoalMutation.isPending}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                  >
                    Set Goal
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
