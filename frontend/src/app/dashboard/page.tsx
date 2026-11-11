"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Timer,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Play,
  BookOpen,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { dashboardApi, tasksApi, analyticsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => dashboardApi.getSummary(),
  });

  const { data: activeTasks } = useQuery({
    queryKey: ["activeTasks"],
    queryFn: () => tasksApi.list({ status: "pending" }),
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["studyRecommendations"],
    queryFn: () => analyticsApi.getRecommendations(),
  });

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header / Welcome greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              {todayDateStr}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Ready to focus? Let's make continuous progress on your goals today.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/focus"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Focus Session
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Link>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Daily Goal Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Daily Focus Target
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {summary ? summary.today_focus_minutes : 0}
                </span>
                <span className="text-sm font-medium text-slate-400">
                  / {summary ? summary.daily_goal_minutes : 120} min
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${summary ? summary.daily_goal_progress_pct : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500">
              {summary && summary.remaining_goal_minutes > 0 ? (
                <span>
                  <strong className="text-slate-800">{summary.remaining_goal_minutes}m</strong>{" "}
                  remaining to reach target
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Daily goal achieved!
                </span>
              )}
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Consistency Streak
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {summary ? summary.current_streak_days : 0}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {summary?.current_streak_days === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {summary && summary.current_streak_days > 0
                ? "Active streak maintained!"
                : "Complete a session today to start your streak."}
            </p>
          </div>

          {/* Completed Sessions Today */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sessions Completed
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {summary ? summary.completed_sessions_count_today : 0}
                </span>
                <span className="text-sm font-medium text-slate-500">today</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Lifetime:{" "}
              <strong className="text-slate-700">
                {summary ? summary.total_lifetime_sessions_count : 0} sessions
              </strong>
            </p>
          </div>

          {/* Active Tasks */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Tasks
              </span>
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {summary ? summary.active_tasks_count : 0}
                </span>
                <span className="text-sm font-medium text-slate-500">active</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {summary ? summary.completed_tasks_count_today : 0} finished today
            </p>
          </div>
        </div>

        {/* Dynamic Study Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Recommended Study Actions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Calculated from your current tasks, overdue items, and cognitive rhythm
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100/80 text-indigo-700">
                Cognitive Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.slice(0, 3).map((rec) => {
                let actionHref = "/focus";
                let actionLabel = "Start Session";

                if (rec.action_type === "session") {
                  actionHref = `/focus?${rec.task_id ? `task_id=${rec.task_id}&` : ""}${
                    rec.technique_slug ? `technique=${rec.technique_slug}` : ""
                  }`;
                  actionLabel = "Start Timer";
                } else if (rec.action_type === "flashcards") {
                  actionHref = "/flashcards";
                  actionLabel = "Review Deck";
                } else if (rec.action_type === "revision") {
                  actionHref = "/revisions";
                  actionLabel = "Go to Calendar";
                } else if (rec.action_type === "feynman" || rec.action_type === "mindmap") {
                  actionHref = "/learning";
                  actionLabel = "Open Workspace";
                }

                const priorityBadge =
                  rec.priority === "high"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : rec.priority === "medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200";

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}
                        >
                          {rec.priority} priority
                        </span>
                        {rec.target_minutes ? (
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rec.target_minutes}m
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 leading-snug">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {rec.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {rec.technique_name ? (
                        <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {rec.technique_name}
                        </span>
                      ) : (
                        <span />
                      )}
                      <Link
                        href={actionHref}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Middle Section: Weekly Focus Chart & Active Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Activity Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Weekly Focus Trend
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actual recorded focus minutes over the past 7 days
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Past 7 Days
              </span>
            </div>

            <div className="h-56 w-full">
              {summary && summary.weekly_focus_summary.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.weekly_focus_summary}>
                    <XAxis
                      dataKey="day_name"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="m"
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} minutes`, "Focus Time"]}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="focus_minutes"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No weekly focus records yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Task Focus Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Priority Tasks
                </h2>
                <Link
                  href="/planner"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeTasks && activeTasks.length > 0 ? (
                <div className="space-y-3">
                  {activeTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:border-indigo-200 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.subject_name && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{
                                backgroundColor: task.subject_colour || "#6366f1",
                              }}
                            >
                              {task.subject_name}
                            </span>
                          )}
                          {task.estimated_duration && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimated_duration}m
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/focus?task_id=${task.id}`}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition shrink-0"
                        title="Study this task"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">
                    No active tasks
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Add a study task to plan your focus sprints.
                  </p>
                  <Link
                    href="/planner"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Task
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Technique library ready</span>
              <Link
                href="/techniques"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Browse techniques →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Study Sessions History */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Study Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic history recorded from your focus timer
              </p>
            </div>
            <Link
              href="/focus"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Open Timer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {summary && summary.recent_sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Technique</th>
                    <th className="pb-3">Subject / Task</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Rating</th>
                    <th className="pb-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.recent_sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800">
                        {session.technique_name || "Focus Session"}
                      </td>
                      <td className="py-3">
                        {session.subject_name ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white mr-2"
                            style={{
                              backgroundColor:
                                session.subject_colour || "#6366f1",
                            }}
                          >
                            {session.subject_name}
                          </span>
                        ) : null}
                        <span className="text-slate-600 text-xs">
                          {session.task_title || "General"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 font-medium text-xs">
                        {Math.round(session.actual_duration / 60)} min
                      </td>
                      <td className="py-3 text-slate-400 text-xs">
                        {new Date(session.started_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3">
                        {session.concentration_rating ? (
                          <div className="flex items-center text-amber-400">
                            {[...Array(session.concentration_rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 text-xs max-w-xs truncate">
                        {session.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Your study journey starts here
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
                No focus sessions recorded yet. Launch a 25-minute Pomodoro or 52/17 session to record your first verified study block!
              </p>
              <Link
                href="/focus"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch First Session
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
