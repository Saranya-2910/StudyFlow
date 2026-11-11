"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Search,
  Star,
  Play,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { techniquesApi } from "@/lib/api";
import { Technique } from "@/types";

export default function TechniquesPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);

  const { data: techniques = [], isLoading } = useQuery({
    queryKey: ["techniques"],
    queryFn: () => techniquesApi.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["techniqueCategories"],
    queryFn: () => techniquesApi.getCategories(),
  });

  const favouriteMutation = useMutation({
    mutationFn: ({ id, isFav }: { id: string; isFav: boolean }) =>
      isFav ? techniquesApi.unfavourite(id) : techniquesApi.favourite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["techniques"] });
    },
  });

  const filteredTechniques = techniques.filter((t) => {
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Study Techniques Library
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              13 evidence-backed methodologies for focus, active recall, and retention.
            </p>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Techniques
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search techniques..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Technique Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechniques.map((tech) => (
            <div
              key={tech.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      tech.category === "Time Management"
                        ? "bg-indigo-50 text-indigo-700"
                        : tech.category === "Learning"
                        ? "bg-violet-50 text-violet-700"
                        : tech.category === "Revision"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {tech.category}
                  </span>

                  <button
                    onClick={() =>
                      favouriteMutation.mutate({
                        id: tech.id,
                        isFav: !!tech.is_favourite,
                      })
                    }
                    className={`p-1.5 rounded-lg transition ${
                      tech.is_favourite
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 hover:text-amber-400"
                    }`}
                    title={tech.is_favourite ? "Remove favourite" : "Bookmark favourite"}
                  >
                    <Star
                      className={`w-4 h-4 ${tech.is_favourite ? "fill-current" : ""}`}
                    />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  {tech.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {tech.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedTechnique(tech)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  Instructions
                </button>

                <Link
                  href={`/focus?technique=${tech.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Launch Focus
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Instructions Modal */}
        {selectedTechnique && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedTechnique(null)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  {selectedTechnique.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedTechnique.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {selectedTechnique.description}
                </p>
              </div>

              <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Step-by-Step Instructions
                </h4>
                <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed space-y-2">
                  {selectedTechnique.instructions}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTechnique(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <Link
                  href={`/focus?technique=${selectedTechnique.slug}`}
                  onClick={() => setSelectedTechnique(null)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-100"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch into Focus Room
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
