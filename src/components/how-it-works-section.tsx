"use client";
import React from "react";
import { motion } from "framer-motion";
import { Orbit, ListFilter, Zap, Headphones } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Orbit,
    title: "Choose Your Orbit",
    description:
      "Select a 10, 20, or 30-minute orbit. This determines how many stories we curate for you.",
  },
  {
    number: "02",
    icon: ListFilter,
    title: "Pick Your Constellation",
    description:
      "Choose from categories like Tech, Sports, Business, Science, and more. Add keywords to narrow your focus.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Get Your Digest",
    description:
      "We fetch the latest, deduplicate, rank, and trim to fit your exact time window. Fresh every session.",
  },
  {
    number: "04",
    icon: Headphones,
    title: "Read or Listen",
    description:
      "Browse your curated feed or tap play for a natural-sounding audio digest. Perfect for on-the-go.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Four steps to clarity
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            From zero to informed in under a minute of setup.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical connector line (desktop) */}
          <div className="hidden md:block absolute left-[39px] top-8 bottom-8 w-px bg-gradient-to-b from-blue-500/30 via-emerald-500/30 to-purple-500/30" />

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex gap-6 md:gap-8 items-start"
              >
                {/* Step number circle */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-blue-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <h3 className="text-white font-semibold text-xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
