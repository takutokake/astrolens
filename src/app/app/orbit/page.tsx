"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_LABELS, DURATIONS, type Category, type Duration } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Orbit,
  ArrowRight,
  Loader2,
  Headphones,
  BookOpen,
  Landmark,
  Trophy,
  Film,
  Cpu,
  TrendingUp,
  Atom,
  Heart,
  Globe,
  Leaf,
  UtensilsCrossed,
  Clock,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  politics: Landmark,
  sports: Trophy,
  entertainment: Film,
  technology: Cpu,
  business: TrendingUp,
  science: Atom,
  health: Heart,
  world: Globe,
  environment: Leaf,
  food: UtensilsCrossed,
};

const durationInfo: Record<Duration, { articles: string; words: string }> = {
  10: { articles: "8–10 articles", words: "~2,000 words" },
  20: { articles: "15–20 articles", words: "~4,000 words" },
  30: { articles: "25–30 articles", words: "~6,000 words" },
};

export default function CreateOrbitPage() {
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [includeLocal, setIncludeLocal] = useState(false);
  const [mode, setMode] = useState<"read" | "listen">("read");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length < 5
        ? [...prev, cat]
        : prev
    );
  };

  const handleGenerate = async () => {
    if (categories.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          categories,
          include_local: includeLocal,
          mode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create digest");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // If mode is listen, trigger TTS generation immediately
      if (mode === "listen") {
        // Trigger TTS generation in the background (don't wait)
        fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ digest_id: data.digest.id }),
        }).catch((err) => console.error("Background TTS error:", err));
      }

      // Store in sessionStorage for the digest view
      sessionStorage.setItem("currentDigest", JSON.stringify(data));

      router.push(`/app/orbit/${data.digest.id}`);
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Orbit className="h-5 w-5 text-blue-400" />
          </div>
          Create Orbit
        </h1>
        <p className="text-slate-400 text-sm mt-2 ml-[52px]">
          Configure your news orbit — duration, topics, and format.
        </p>
      </div>

      {/* Step 1: Duration */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">
          1. Choose Duration
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`relative p-4 rounded-xl border text-center transition-all ${
                duration === d
                  ? "bg-blue-500/10 border-blue-500/30 text-white"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xl font-bold">{d}</span>
                <span className="text-sm">min</span>
              </div>
              <p className="text-xs text-slate-500">{durationInfo[d].articles}</p>
              <p className="text-xs text-slate-600">{durationInfo[d].words}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Categories */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">
          2. Select Topics
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Choose up to 5 categories for your constellation
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = categories.includes(cat);
            const Icon = iconMap[cat] || Globe;
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm transition-all ${
                  isSelected
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {CATEGORY_LABELS[cat as Category]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Options */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">
          3. Options
        </h2>

        {/* Local news toggle */}
        <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={includeLocal}
            onChange={(e) => setIncludeLocal(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
          />
          <div>
            <p className="text-sm text-white">Include local news</p>
            <p className="text-xs text-slate-500">
              Add stories from your country/region
            </p>
          </div>
        </label>

        {/* Mode selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("read")}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
              mode === "read"
                ? "bg-blue-500/10 border-blue-500/30 text-white"
                : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <div className="text-left">
              <p className="text-sm font-medium">Generate & Read</p>
              <p className="text-xs text-slate-500">Text digest</p>
            </div>
          </button>
          <button
            onClick={() => setMode("listen")}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
              mode === "listen"
                ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]"
            }`}
          >
            <Headphones className="h-5 w-5" />
            <div className="text-left">
              <p className="text-sm font-medium">Generate & Listen</p>
              <p className="text-xs text-slate-500">Audio + text</p>
            </div>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={categories.length === 0 || loading}
        className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 text-base disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating your {duration}-minute orbit...
          </>
        ) : (
          <>
            Start {duration}-minute orbit
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
