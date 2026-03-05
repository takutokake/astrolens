"use client";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Telescope,
  ArrowRight,
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
  Sparkles,
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

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("users")
        .update({ categories: selected })
        .eq("id", user.id);
    }

    window.location.href = "/app";
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5">
            <Sparkles className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Build your constellation
          </h1>
          <p className="text-slate-400 text-lg">
            Select the topics you want in your news sky. You can change these
            anytime.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat);
            const Icon = iconMap[cat] || Globe;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleCategory(cat)}
                className={`relative flex flex-col items-center gap-2.5 p-5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">
                  {CATEGORY_LABELS[cat as Category]}
                </span>
                {isSelected && (
                  <motion.div
                    layoutId="check"
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Continue button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={selected.length === 0 || loading}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-10 h-12 text-base gap-2 disabled:opacity-40"
          >
            {loading ? "Setting up..." : `Continue with ${selected.length} topic${selected.length !== 1 ? "s" : ""}`}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
          <p className="text-slate-600 text-xs mt-3">
            Select at least 1 topic
          </p>
        </div>
      </motion.div>
    </div>
  );
}
