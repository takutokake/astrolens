import React from "react";
import { Telescope } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Resources: ["Documentation", "API Reference", "Blog", "Support"],
  Company: ["About", "Careers", "Privacy", "Terms"],
};

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <Telescope className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Astralens
              </span>
            </a>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              See the news through a clearer cosmos. Curated digests for the
              time you have.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white text-sm font-semibold mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            &copy; {new Date().getFullYear()} Astralens. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
