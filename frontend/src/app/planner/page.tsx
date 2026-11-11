"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Play,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  AlertCircle,
  Tag,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { subjectsApi, tasksApi } from "@/lib/api";
import { Subject, Task } from "@/types";

const SUBJECT_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

export default function PlannerPage() {
  const queryClient = useQueryClient();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("");

  // Modals
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);

  // New Subject Form
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjDesc, setNewSubjDesc] = useState("");
  const [newSubjColor, setNewSubjColor] = useState(SUBJECT_COLORS[0]);

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newTaskDuration, setNewTaskDuration] = useState<number>(30);
  const [newTaskSubjectId, setNewTaskSubjectId] = useState<string>("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("");

  // Queries
  const { data: subjects = [], isLoading: isSubjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list(),
  });

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", statusFilter, selectedSubjectFilter],
    queryFn: () =>
      tasksApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        subject_id: selectedSubjectFilter || undefined,
      }),
  });

  // Mutations
  const createSubjectMutation = useMutation({
    mutationFn: subjectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setShowSubjectModal(false);
      setNewSubjName("");
      setNewSubjDesc("");
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: subjectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      setShowTaskModal(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDueDate("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    createSubjectMutation.mutate({
      name: newSubjName.trim(),
      description: newSubjDesc.trim() || undefined,
      colour: newSubjColor,
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      priority: newTaskPriority,
      estimated_duration: Number(newTaskDuration) || 30,
      subject_id: newTaskSubjectId || undefined,
      due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
    });
  };

  const toggleTaskStatus = (task: Task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: nextStatus },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Study Planner
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Organize your academic subjects, priorities, and actionable tasks.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
            >
              <Plus className="w-4 h-4" />
              New Subject
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Subjects Bar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Subjects ({subjects.length})
            </h2>
          </div>

          {subjects.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl bg-white border transition relative group cursor-pointer ${
                    selectedSubjectFilter === s.id
                      ? "border-indigo-500 shadow-sm ring-2 ring-indigo-50"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                  onClick={() =>
                    setSelectedSubjectFilter(selectedSubjectFilter === s.id ? "" : s.id)
                  }
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.colour }}
                      />
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {s.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete subject "${s.name}"?`)) {
                          deleteSubjectMutation.mutate(s.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-2">
                    <span>{s.tasks_count || 0} tasks</span>
                    <span>{s.total_study_minutes || 0}m studied</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No subjects defined yet. Click "New Subject" to create your first course.
            </div>
          )}
        </div>

        {/* Tasks Section with Filter Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { label: "All Tasks", val: "all" },
                { label: "Pending", val: "pending" },
                { label: "Completed", val: "completed" },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setStatusFilter(tab.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === tab.val
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {selectedSubjectFilter && (
              <button
                onClick={() => setSelectedSubjectFilter("")}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Clear subject filter
              </button>
            )}
          </div>

          {/* Tasks List */}
          {tasks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/50 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="text-slate-300 hover:text-indigo-600 transition shrink-0"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          task.status === "completed"
                            ? "line-through text-slate-400"
                            : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
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
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            task.priority === "urgent"
                              ? "bg-rose-100 text-rose-700"
                              : task.priority === "high"
                              ? "bg-amber-100 text-amber-700"
                              : task.priority === "medium"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.estimated_duration && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimated_duration}m
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.status !== "completed" && (
                      <Link
                        href={`/focus?task_id=${task.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Study Task
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          deleteTaskMutation.mutate(task.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded transition opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No tasks found</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Keep your momentum by adding assignments or study goals.
              </p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Task
              </button>
            </div>
          )}
        </div>

        {/* Create Subject Modal */}
        {showSubjectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Create New Subject
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Group tasks, topics, and focus sessions by academic course.
              </p>

              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    placeholder="e.g. Organic Chemistry, Algorithms"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSubjDesc}
                    onChange={(e) => setNewSubjDesc(e.target.value)}
                    placeholder="e.g. Semester 2 core requirement"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    Subject Colour
                  </label>
                  <div className="flex items-center gap-2">
                    {SUBJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSubjColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          newSubjColor === c ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSubjectModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubjectMutation.isPending}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                  >
                    Create Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Add Study Task
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Define actionable objectives to tackle during your focus blocks.
              </p>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Read Chapter 5 and do practice problems"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subject
                  </label>
                  <select
                    value={newTaskSubjectId}
                    onChange={(e) => setNewTaskSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">General / No Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Est. Minutes
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="360"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                  >
                    Save Task
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
