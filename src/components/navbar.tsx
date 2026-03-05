"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Telescope, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#020617]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Telescope className="h-7 w-7 text-blue-500 transition-transform group-hover:rotate-12" />
              <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Astralens
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/auth/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </a>
            <a href="/auth/sign-up">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5">
                Get Started
              </Button>
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/5"
        >
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-slate-300 hover:text-white py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-3 border-t border-white/10">
              <a href="/auth/sign-in" className="block">
                <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-white/5">
                  Sign In
                </Button>
              </a>
              <a href="/auth/sign-up" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-full">
                  Get Started
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
