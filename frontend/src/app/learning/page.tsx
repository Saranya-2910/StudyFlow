"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Brain,
  FileText,
  Network,
  Layers,
  Plus,
  Play,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Save,
  RotateCw,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { learningApi, subjectsApi } from "@/lib/api";
import { FeynmanNote, BrainDumpSession, MindMap, MindMapNode } from "@/types";

export default function ActiveLearningPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"feynman" | "braindump" | "mindmap" | "interleaving">("feynman");

  // ------------------ FEYNMAN STATE ------------------ //
  const [feynmanTitle, setFeynmanTitle] = useState("");
  const [feynmanAudience, setFeynmanAudience] = useState("A 10-year old / complete beginner");
  const [feynmanExplanation, setFeynmanExplanation] = useState("");
  const [feynmanGaps, setFeynmanGaps] = useState("");
  const [feynmanAnalogy, setFeynmanAnalogy] = useState("");
  const [editingFeynmanId, setEditingFeynmanId] = useState<string | null>(null);

  // ------------------ BRAIN DUMP STATE ------------------ //
  const [dumpTitle, setDumpTitle] = useState("");
  const [dumpContent, setDumpContent] = useState("");
  const [dumpGaps, setDumpGaps] = useState("");
  const [dumpDurationMinutes, setDumpDurationMinutes] = useState(10);
  const [dumpTimerActive, setDumpTimerActive] = useState(false);
  const [dumpSecondsLeft, setDumpSecondsLeft] = useState(10 * 60);

  // ------------------ MIND MAP STATE ------------------ //
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [newMapTitle, setNewMapTitle] = useState("");
  const [activeNodes, setActiveNodes] = useState<MindMapNode[]>([
    { id: "root", text: "Central Core Concept", x: 260, y: 150, isRoot: true },
    { id: "child-1", text: "Key Principle A", x: 80, y: 80 },
    { id: "child-2", text: "Key Principle B", x: 440, y: 80 },
    { id: "child-3", text: "Real-world Example", x: 260, y: 260 },
  ]);
  const [newNodeText, setNewNodeText] = useState("");

  // ------------------ INTERLEAVING STATE ------------------ //
  const [interleavedSubject1, setInterleavedSubject1] = useState("");
  const [interleavedSubject2, setInterleavedSubject2] = useState("");
  const [interleavedDuration, setInterleavedDuration] = useState(25);

  // ------------------ QUERIES ------------------ //
  const { data: feynmanNotes = [] } = useQuery({
    queryKey: ["feynmanNotes"],
    queryFn: () => learningApi.listFeynman(),
  });

  const { data: brainDumps = [] } = useQuery({
    queryKey: ["brainDumps"],
    queryFn: () => learningApi.listBrainDumps(),
  });

  const { data: mindMaps = [] } = useQuery({
    queryKey: ["mindMaps"],
    queryFn: () => learningApi.listMindMaps(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list(),
  });

  // ------------------ MUTATIONS ------------------ //
  const saveFeynmanMutation = useMutation({
    mutationFn: (data: Partial<FeynmanNote>) =>
      editingFeynmanId
        ? learningApi.updateFeynman(editingFeynmanId, data)
        : learningApi.createFeynman(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feynmanNotes"] });
      resetFeynmanForm();
    },
  });

  const deleteFeynmanMutation = useMutation({
    mutationFn: learningApi.deleteFeynman,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feynmanNotes"] });
    },
  });

  const saveBrainDumpMutation = useMutation({
    mutationFn: learningApi.createBrainDump,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brainDumps"] });
      setDumpTitle("");
      setDumpContent("");
      setDumpGaps("");
      setDumpTimerActive(false);
    },
  });

  const deleteBrainDumpMutation = useMutation({
    mutationFn: learningApi.deleteBrainDump,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brainDumps"] });
    },
  });

  const saveMindMapMutation = useMutation({
    mutationFn: (data: Partial<MindMap>) =>
      selectedMapId
        ? learningApi.updateMindMap(selectedMapId, data)
        : learningApi.createMindMap(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["mindMaps"] });
      setSelectedMapId(saved.id);
    },
  });

  const deleteMindMapMutation = useMutation({
    mutationFn: learningApi.deleteMindMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mindMaps"] });
      setSelectedMapId(null);
    },
  });

  // ------------------ FEYNMAN HANDLERS ------------------ //
  const handleSaveFeynman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feynmanTitle.trim() || !feynmanExplanation.trim()) return;

    saveFeynmanMutation.mutate({
      concept_title: feynmanTitle.trim(),
      target_audience: feynmanAudience.trim(),
      explanation: feynmanExplanation.trim(),
      identified_gaps: feynmanGaps.trim() || undefined,
      simplified_analogy: feynmanAnalogy.trim() || undefined,
    });
  };

  const loadFeynmanForEdit = (note: FeynmanNote) => {
    setEditingFeynmanId(note.id);
    setFeynmanTitle(note.concept_title);
    setFeynmanAudience(note.target_audience);
    setFeynmanExplanation(note.explanation);
    setFeynmanGaps(note.identified_gaps || "");
    setFeynmanAnalogy(note.simplified_analogy || "");
  };

  const resetFeynmanForm = () => {
    setEditingFeynmanId(null);
    setFeynmanTitle("");
    setFeynmanAudience("A 10-year old / complete beginner");
    setFeynmanExplanation("");
    setFeynmanGaps("");
    setFeynmanAnalogy("");
  };

  // ------------------ BRAIN DUMP HANDLERS ------------------ //
  const startDumpTimer = () => {
    setDumpSecondsLeft(dumpDurationMinutes * 60);
    setDumpTimerActive(true);
  };

  React.useEffect(() => {
    if (!dumpTimerActive) return;
    const interval = setInterval(() => {
      setDumpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDumpTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dumpTimerActive]);

  const handleSaveDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dumpTitle.trim() || !dumpContent.trim()) return;
    saveBrainDumpMutation.mutate({
      title: dumpTitle.trim(),
      content: dumpContent.trim(),
      duration_seconds: dumpDurationMinutes * 60 - dumpSecondsLeft,
      knowledge_gaps: dumpGaps.trim() || undefined,
    });
  };

  // ------------------ MIND MAP HANDLERS ------------------ //
  const handleAddChildNode = () => {
    if (!newNodeText.trim()) return;
    const newId = `node-${Date.now()}`;
    const angle = Math.random() * Math.PI * 2;
    const distance = 160;
    const root = activeNodes.find((n) => n.isRoot) || activeNodes[0];

    const newNode: MindMapNode = {
      id: newId,
      text: newNodeText.trim(),
      x: Math.round(root.x + Math.cos(angle) * distance),
      y: Math.round(root.y + Math.sin(angle) * distance),
    };

    setActiveNodes([...activeNodes, newNode]);
    setNewNodeText("");
  };

  const handleDeleteNode = (id: string) => {
    setActiveNodes(activeNodes.filter((n) => n.id !== id));
  };

  const handleSaveCurrentMap = () => {
    const rootNode = activeNodes.find((n) => n.isRoot) || activeNodes[0];
    const title = newMapTitle || rootNode?.text || "Untitled Mind Map";

    const connections = activeNodes
      .filter((n) => !n.isRoot)
      .map((n) => ({ from: rootNode.id, to: n.id }));

    saveMindMapMutation.mutate({
      title,
      graph_data: {
        nodes: activeNodes,
        connections,
      },
    });
  };

  const loadMindMap = (map: MindMap) => {
    setSelectedMapId(map.id);
    setNewMapTitle(map.title);
    if (map.graph_data?.nodes) {
      setActiveNodes(map.graph_data.nodes);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Cognitive Learning Workspaces
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Learning Studio
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Break free from passive re-reading with evidence-based cognitive retrieval and synthesis tools.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "feynman", label: "The Feynman Technique", icon: BookOpen },
            { id: "braindump", label: "Brain Dump Retrieval", icon: FileText },
            { id: "mindmap", label: "Visual Mind Mapping", icon: Network },
            { id: "interleaving", label: "Interleaved Study", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ------------------ TAB 1: THE FEYNMAN TECHNIQUE ------------------ */}
        {activeTab === "feynman" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor form */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingFeynmanId ? "Edit Feynman Explanation" : "Explain It Simply"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Teach the concept in clear, jargon-free words to expose hidden gaps in understanding.
                  </p>
                </div>
                {editingFeynmanId && (
                  <button
                    onClick={resetFeynmanForm}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveFeynman} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Concept to Master
                    </label>
                    <input
                      type="text"
                      required
                      value={feynmanTitle}
                      onChange={(e) => setFeynmanTitle(e.target.value)}
                      placeholder="e.g. Backpropagation, Photosynthesis"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={feynmanAudience}
                      onChange={(e) => setFeynmanAudience(e.target.value)}
                      placeholder="e.g. A 10-year old child"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Plain-Language Explanation (No Technical Jargon)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feynmanExplanation}
                    onChange={(e) => setFeynmanExplanation(e.target.value)}
                    placeholder="Explain the idea as if you were talking to someone with zero background knowledge. Where do things come from? Why does it matter?"
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Identified Knowledge Gaps (What got vague?)
                    </label>
                    <textarea
                      rows={3}
                      value={feynmanGaps}
                      onChange={(e) => setFeynmanGaps(e.target.value)}
                      placeholder="e.g. Exactly how the chemical bond breaks before oxygen release..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Simplified Everyday Analogy
                    </label>
                    <textarea
                      rows={3}
                      value={feynmanAnalogy}
                      onChange={(e) => setFeynmanAnalogy(e.target.value)}
                      placeholder="e.g. It works like a factory conveyor belt where workers hand off packages..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saveFeynmanMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
                  >
                    <Save className="w-4 h-4" />
                    {editingFeynmanId ? "Update Explanation" : "Save Concept Explanation"}
                  </button>
                </div>
              </form>
            </div>

            {/* Saved explanations library */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>My Concepts ({feynmanNotes.length})</span>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </h3>

                {feynmanNotes.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {feynmanNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {note.concept_title}
                          </h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => loadFeynmanForEdit(note)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Edit explanation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${note.concept_title}"?`)) {
                                  deleteFeynmanMutation.mutate(note.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete explanation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {note.explanation}
                        </p>
                        {note.simplified_analogy && (
                          <div className="mt-2 text-[11px] text-indigo-600 bg-indigo-50/60 p-2 rounded-lg italic">
                            "{note.simplified_analogy}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    No concept notes saved yet. Write an explanation on the left to begin your Feynman catalog.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------ TAB 2: BRAIN DUMP WORKSPACE ------------------ */}
        {activeTab === "braindump" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Timed Blank-Canvas Retrieval
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Write everything you know from pure memory without opening any notes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!dumpTimerActive ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={dumpDurationMinutes}
                        onChange={(e) => setDumpDurationMinutes(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium"
                      >
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                      </select>
                      <button
                        onClick={startDumpTimer}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Timer
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {Math.floor(dumpSecondsLeft / 60)}:
                      {String(dumpSecondsLeft % 60).padStart(2, "0")} remaining
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveDump} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Session Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={dumpTitle}
                    onChange={(e) => setDumpTitle(e.target.value)}
                    placeholder="e.g. World War II European Theater Major Battles"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">
                      Unconstrained Memory Dump
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {dumpContent.trim() ? dumpContent.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    required
                    value={dumpContent}
                    onChange={(e) => setDumpContent(e.target.value)}
                    placeholder="Type continuously: dates, formulas, causes, key actors, sequences, definitions. Don't worry about formatting—just pour out your recall."
                    className="w-full p-4 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Identified Knowledge Gaps (After comparing with reference material)
                  </label>
                  <textarea
                    rows={2}
                    value={dumpGaps}
                    onChange={(e) => setDumpGaps(e.target.value)}
                    placeholder="What did you miss or confuse? e.g. Battle of the Bulge dates, supply chain mechanics..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saveBrainDumpMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Brain Dump Archive
                  </button>
                </div>
              </form>
            </div>

            {/* Archive */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Past Dumps ({brainDumps.length})</span>
                  <FileText className="w-4 h-4 text-indigo-600" />
                </h3>

                {brainDumps.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {brainDumps.map((dump) => (
                      <div
                        key={dump.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {dump.title}
                          </h4>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${dump.title}"?`)) {
                                deleteBrainDumpMutation.mutate(dump.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 font-mono">
                          {dump.content}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                          <span>{new Date(dump.created_at).toLocaleDateString()}</span>
                          <span>{Math.round(dump.duration_seconds / 60)}m dump</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    No retrieval sessions archived yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------ TAB 3: VISUAL MIND MAPPING ------------------ */}
        {activeTab === "mindmap" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Visual Node Graph Studio
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structure interconnected concepts visually. Changes persist to PostgreSQL as JSON.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNodeText}
                    onChange={(e) => setNewNodeText(e.target.value)}
                    placeholder="New branch name..."
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddChildNode}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Node
                  </button>
                  <button
                    onClick={handleSaveCurrentMap}
                    disabled={saveMindMapMutation.isPending}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Map
                  </button>
                </div>
              </div>

              {/* Interactive SVG Canvas */}
              <div className="relative w-full h-[450px] bg-slate-50/70 border border-slate-200/60 rounded-2xl my-4 overflow-hidden select-none">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Draw spline lines from root to each child */}
                  {activeNodes
                    .filter((n) => !n.isRoot)
                    .map((node) => {
                      const root = activeNodes.find((n) => n.isRoot) || activeNodes[0];
                      return (
                        <line
                          key={`line-${node.id}`}
                          x1={root.x + 80}
                          y1={root.y + 24}
                          x2={node.x + 60}
                          y2={node.y + 20}
                          stroke="#cbd5e1"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                      );
                    })}
                </svg>

                {/* Render nodes */}
                {activeNodes.map((node) => (
                  <div
                    key={node.id}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute p-3 rounded-2xl shadow-sm text-xs font-bold transition flex items-center gap-2 ${
                      node.isRoot
                        ? "bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-50 min-w-[160px] justify-center"
                        : "bg-white text-slate-800 border border-slate-200 hover:border-indigo-400 min-w-[120px]"
                    }`}
                  >
                    <span className="truncate">{node.text}</span>
                    {!node.isRoot && (
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="text-slate-300 hover:text-rose-500 transition ml-auto"
                        title="Remove branch"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Saved Mind Maps Selector */}
              {mindMaps.length > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    Saved Maps:
                  </span>
                  {mindMaps.map((map) => (
                    <button
                      key={map.id}
                      onClick={() => loadMindMap(map)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 ${
                        selectedMapId === map.id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {map.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------ TAB 4: INTERLEAVED STUDY ------------------ */}
        {activeTab === "interleaving" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Design Interleaved Study Block
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Rather than studying one subject for hours, alternating between 2 complementary topics trains your cognitive flexibility and pattern recognition.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Topic A (First Half)
                  </label>
                  <select
                    value={interleavedSubject1}
                    onChange={(e) => setInterleavedSubject1(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Primary Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Topic B (Second Half)
                  </label>
                  <select
                    value={interleavedSubject2}
                    onChange={(e) => setInterleavedSubject2(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Secondary Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Interval per Topic ({interleavedDuration} minutes each)
                </label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={interleavedDuration}
                  onChange={(e) => setInterleavedDuration(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>15m</span>
                  <span>25m</span>
                  <span>45m</span>
                  <span>60m</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                <div>
                  <p className="font-bold">Interleaved Plan:</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    {interleavedDuration}m Topic A ➔ 5m break ➔ {interleavedDuration}m Topic B
                  </p>
                </div>
                <Link
                  href={`/focus?technique=interleaving`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Launch Session
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
