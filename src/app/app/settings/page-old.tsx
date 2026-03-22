"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";
import type { User } from "@/lib/types";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  Loader2,
  Check,
  Globe,
  Languages,
  Clock,
  Landmark,
  Trophy,
  Film,
  Cpu,
  TrendingUp,
  Atom,
  Heart,
  Leaf,
  UtensilsCrossed,
  History,
} from "lucide-react";
import Link from "next/link";

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

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [categories, setCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>("");
  const [countries, setCountries] = useState<string>("");
  const [languages, setLanguages] = useState<string>("en");
  const [maxRecency, setMaxRecency] = useState(24);
  const [sentimentMode, setSentimentMode] = useState<string>("any");
  const [includeLocal, setIncludeLocal] = useState(false);

  // Past orbits
  const [digests, setDigests] = useState<any[]>([]);
  const [loadingDigests, setLoadingDigests] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        const u = data.user as User;
        setUser(u);
        setCategories(u.categories || []);
        setKeywords((u.keywords || []).join(", "));
        setCountries((u.countries || []).join(", "));
        setLanguages((u.languages || ["en"]).join(", "));
        setMaxRecency(u.max_recency_hours || 24);
        setSentimentMode(u.sentiment_mode || "any");
        setIncludeLocal(u.include_local || false);
      }
      setLoading(false);
    };
    fetchUser();

    // Fetch past orbits
    const fetchDigests = async () => {
      setLoadingDigests(true);
      const res = await fetch("/api/digest");
      if (res.ok) {
        const data = await res.json();
        setDigests(data.digests || []);
      }
      setLoadingDigests(false);
    };
    fetchDigests();
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const payload = {
      categories,
      keywords: keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      countries: countries
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      languages: languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      max_recency_hours: maxRecency,
      sentiment_mode: sentimentMode,
      include_local: includeLocal,
    };

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Settings className="h-5 w-5 text-purple-400" />
          </div>
          Control Panel
        </h1>
        <p className="text-slate-400 text-sm mt-2 ml-[52px]">
          Configure your news constellation and preferences.
        </p>
      </div>

      {/* Categories */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">
          Categories
        </h2>
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
      </section>

      {/* Keywords */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">
          Keywords (Optional)
        </h2>
        <p className="text-xs text-slate-500 mb-2">
          Leave empty for broader results. Add specific terms to narrow focus (e.g. AI, Lakers, startups)
        </p>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Leave empty or: AI, startups, climate"
          className="w-full h-10 px-4 rounded-lg bg-[#0f172a] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
        />
      </section>

      {/* Region & Language */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Countries (Optional)
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            Leave empty for worldwide news. Free tier works best without filters.
          </p>
          <input
            type="text"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="Leave empty or: us, gb, jp"
            className="w-full h-10 px-4 rounded-lg bg-[#0f172a] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          />
        </div>
        <div>
          <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5" /> Language
          </h2>
          <select
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full h-10 px-4 rounded-lg bg-[#0f172a] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
      </section>

      {/* Recency & Sentiment */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Max Recency (hours)
          </h2>
          <input
            type="number"
            value={maxRecency}
            onChange={(e) => setMaxRecency(Number(e.target.value))}
            min={1}
            max={72}
            className="w-full h-10 px-4 rounded-lg bg-[#0f172a] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          />
        </div>
        <div>
          <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">
            Sentiment Mode
          </h2>
          <select
            value={sentimentMode}
            onChange={(e) => setSentimentMode(e.target.value)}
            className="w-full h-10 px-4 rounded-lg bg-[#0f172a] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none"
          >
            <option value="any">Any</option>
            <option value="positive_only">Positive only</option>
            <option value="mix">Balanced mix</option>
          </select>
        </div>
      </section>

      {/* Local toggle */}
      <section className="mb-8">
        <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
          <input
            type="checkbox"
            checked={includeLocal}
            onChange={(e) => setIncludeLocal(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
          />
          <div>
            <p className="text-sm text-white">Include local news</p>
            <p className="text-xs text-slate-500">
              Include regional stories from your selected countries
            </p>
          </div>
        </label>
      </section>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8 h-10 gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Preferences
          </>
        )}
      </Button>

      {/* Past Orbits */}
      <section className="mt-16">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-slate-400" />
          Past Orbits
        </h2>

        {loadingDigests && (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Loading history...</p>
          </div>
        )}

        {!loadingDigests && digests.length === 0 && (
          <p className="text-slate-500 text-sm py-4">
            No past orbits yet. Create your first one!
          </p>
        )}

        <div className="space-y-2">
          {digests.map((d) => (
            <Link
              key={d.id}
              href={`/app/orbit/${d.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                  {d.duration}m
                </div>
                <div>
                  <p className="text-sm text-white group-hover:text-blue-300 transition-colors">
                    {(d.categories as string[])
                      .map((c) => CATEGORY_LABELS[c as Category] || c)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(d.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {d.word_count.toLocaleString()} words
                  </p>
                </div>
              </div>
              {d.audio_url && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                  Audio
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
