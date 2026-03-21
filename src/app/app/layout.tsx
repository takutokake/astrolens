"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Telescope,
  Compass,
  Orbit,
  Bookmark,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/app", label: "Your Sky", icon: Compass },
  { href: "/app/orbit", label: "Create Orbit", icon: Orbit },
  { href: "/app/starred", label: "Starred", icon: Bookmark },
  { href: "/app/settings", label: "Control Panel", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.name || data.user.email || null);
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Hide sidebar on onboarding
  if (pathname === "/app/onboarding") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#0a0f1e]">
        {/* Logo */}
        <div className="p-6">
          <Link href="/app" className="flex items-center gap-2.5">
            <Telescope className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Astralens
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/5">
          {userName && (
            <p className="text-sm text-slate-400 mb-3 truncate px-2">
              {userName}
            </p>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <Telescope className="h-5 w-5 text-blue-500" />
          <span className="text-base font-bold text-white">Astralens</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-400"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#020617]/95 pt-14">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-500 hover:text-red-400 w-full mt-4"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:pt-0 pt-14 overflow-hidden flex flex-col">
        {pathname === "/app" ? (
          <div className="flex-1 overflow-hidden">{children}</div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
