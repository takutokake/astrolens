"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Headphones,
  Layers,
  Globe,
  Sparkles,
  Bookmark,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Time-Based Orbits",
    description:
      "Choose 10, 20, or 30-minute digests. We curate exactly the right number of stories for the time you have.",
    color: "blue",
  },
  {
    icon: Headphones,
    title: "Listen on the Go",
    description:
      "Natural-sounding audio powered by Google Cloud TTS. Perfect for commutes, workouts, or getting ready.",
    color: "emerald",
  },
  {
    icon: Layers,
    title: "Your Constellation",
    description:
      "Pick categories like Tech, Sports, Business, Science. Add keywords to fine-tune your news universe.",
    color: "purple",
  },
  {
    icon: Globe,
    title: "Global & Local",
    description:
      "From world headlines to your local beat. Toggle regional coverage and choose countries and languages.",
    color: "amber",
  },
  {
    icon: Sparkles,
    title: "Smart Curation",
    description:
      "We deduplicate, rank, and summarize. No noise, no repeats — just the stories that matter to you.",
    color: "pink",
  },
  {
    icon: Bookmark,
    title: "Star & Revisit",
    description:
      "Save articles for later and browse your digest history. Replay past audio orbits anytime.",
    color: "cyan",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    glow: "group-hover:shadow-blue-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    glow: "group-hover:shadow-emerald-500/10",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    glow: "group-hover:shadow-purple-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    glow: "group-hover:shadow-amber-500/10",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    text: "text-pink-400",
    glow: "group-hover:shadow-pink-500/10",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    glow: "group-hover:shadow-cyan-500/10",
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-blue-400 text-sm font-medium uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Your personal news observatory
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            Every feature is designed around intentional, time-bounded
            consumption — not infinite scrolling.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:shadow-lg ${colors.glow}`}
              >
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${colors.bg} ${colors.border} border mb-4`}
                >
                  <feature.icon className={`h-5 w-5 ${colors.text}`} />
                </div>

                {/* Text */}
                <h3 className="text-white font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Subtle hover line */}
                <div
                  className={`absolute bottom-0 left-6 right-6 h-px ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
