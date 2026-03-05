"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative z-10 pt-20 md:pt-12">
      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center gap-6">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Personalized news orbits</span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl"
              >
                <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
                  See the news through
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
                  a clearer cosmos
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed"
              >
                Get informed in the time you have. Choose your duration, pick
                your topics, and receive a curated constellation of stories —
                read or listen.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 pt-2"
              >
                <a href="/auth/sign-up">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-12 text-base gap-2 group"
                  >
                    Start Your Orbit
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 h-12 text-base gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Watch Demo
                </Button>
              </motion.div>
            </div>
          }
        >
          {/* Dashboard mockup inside the scroll animation card */}
          <div className="relative h-full w-full bg-[#0f172a] rounded-xl overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-slate-500">
                  astralens.app/your-sky
                </div>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">Your Sky</h3>
                  <p className="text-slate-500 text-sm">March 5, 2026 — 8 stories curated</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                    10 min orbit
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    Audio ready
                  </div>
                </div>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 flex-wrap">
                {["Technology", "Business", "Science", "World"].map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-xs border border-white/5"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* News cards mock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    title: "AI Breakthrough in Protein Folding",
                    source: "TechCrunch",
                    cat: "Technology",
                    color: "blue",
                  },
                  {
                    title: "Global Markets Rally on Trade Deal",
                    source: "Reuters",
                    cat: "Business",
                    color: "emerald",
                  },
                  {
                    title: "NASA Confirms Water on Europa",
                    source: "Space.com",
                    cat: "Science",
                    color: "purple",
                  },
                  {
                    title: "Renewable Energy Hits Record Output",
                    source: "Bloomberg",
                    cat: "World",
                    color: "amber",
                  },
                ].map((article) => (
                  <div
                    key={article.title}
                    className="p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-white text-sm font-medium leading-snug">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">{article.source}</span>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-slate-500 text-xs">2 min read</span>
                        </div>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          article.color === "blue"
                            ? "bg-blue-400"
                            : article.color === "emerald"
                            ? "bg-emerald-400"
                            : article.color === "purple"
                            ? "bg-purple-400"
                            : "bg-amber-400"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Audio player mock */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>3:24</span>
                    <span>10:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
}
