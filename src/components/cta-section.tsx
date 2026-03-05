"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Telescope } from "lucide-react";

export function CTASection() {
  return (
    <section id="pricing" className="relative z-10 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/10 via-[#0f172a] to-emerald-600/10"
        >
          {/* Background glow effects */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

          <div className="relative px-6 py-16 md:px-16 md:py-24 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8"
            >
              <Telescope className="h-8 w-8 text-blue-400" />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                Ready to see your sky?
              </span>
            </h2>

            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
              Join Astralens for free. Create your first orbit in under a minute
              and discover news aligned like stars in a clear night sky.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/auth/sign-up">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-10 h-13 text-base gap-2 group"
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </a>
              <span className="text-slate-500 text-sm">
                No credit card required
              </span>
            </div>

            {/* Trust/stats row */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
              {[
                { stat: "10k+", label: "Early Users" },
                { stat: "50k+", label: "Orbits Created" },
                { stat: "4.9", label: "User Rating" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{item.stat}</p>
                  <p className="text-slate-500 text-xs mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
