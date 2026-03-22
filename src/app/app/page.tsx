"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { Article, User } from "@/lib/types";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import {
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Loader2,
  BookmarkCheck,
  RefreshCw,
} from "lucide-react";

export default function YourSkyPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("News API error:", res.status, errorData);
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (profile) setUser(profile as User);
      }
    });
    fetchArticles();
  }, [fetchArticles]);

  // Refresh when user returns to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchArticles();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchArticles]);

  // Scroll snap detection - track which article is active
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        const newIndex = Math.round(scrollTop / clientHeight);
        
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < articles.length) {
          setCurrentIndex(newIndex);
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [currentIndex, articles.length]);

  // Keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, articles.length - 1);
        container.scrollTo({
          top: nextIndex * container.clientHeight,
          behavior: 'smooth'
        });
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        container.scrollTo({
          top: prevIndex * container.clientHeight,
          behavior: 'smooth'
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, articles.length]);

  const handleSave = async (articleId: string) => {
    if (savedIds.has(articleId)) return;
    setSavingIds((prev) => new Set(prev).add(articleId));
    try {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId }),
      });
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId, interaction_type: "save" }),
      });
      setSavedIds((prev) => new Set(prev).add(articleId));
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(articleId);
      return next;
    });
  };

  const handleShare = async (article: Article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.article_url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(article.article_url);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getCategoryGradient = (category: string): string => {
    const gradients: Record<string, string> = {
      politics: "from-indigo-900/80 via-slate-900/90 to-slate-950",
      sports: "from-emerald-900/80 via-slate-900/90 to-slate-950",
      entertainment: "from-pink-900/80 via-slate-900/90 to-slate-950",
      technology: "from-cyan-900/80 via-slate-900/90 to-slate-950",
      business: "from-amber-900/80 via-slate-900/90 to-slate-950",
      science: "from-violet-900/80 via-slate-900/90 to-slate-950",
      health: "from-rose-900/80 via-slate-900/90 to-slate-950",
      world: "from-blue-900/80 via-slate-900/90 to-slate-950",
      environment: "from-green-900/80 via-slate-900/90 to-slate-950",
      food: "from-orange-900/80 via-slate-900/90 to-slate-950",
    };
    return gradients[category] || "from-slate-900/80 via-slate-900/90 to-slate-950";
  };

  // Loading state
  if (loading && articles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#020617]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-lg">Scanning the cosmos for stories...</p>
        <p className="text-slate-600 text-sm mt-2">
          {user?.categories?.length
            ? `Loading ${user.categories.map((c) => CATEGORY_LABELS[c as Category] || c).join(", ")}`
            : "Loading your feed"}
        </p>
      </div>
    );
  }

  // Empty state
  if (!loading && articles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#020617] px-6">
        <div className="text-6xl mb-6">🔭</div>
        <p className="text-white text-xl font-semibold mb-2">No stories found</p>
        {user && user.categories.length === 0 ? (
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-6">
              You haven&apos;t selected any categories yet.
            </p>
            <a
              href="/app/settings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Select Categories
            </a>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-6">
              News is fetched hourly. Check back soon or try different categories.
            </p>
            <button
              onClick={fetchArticles}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors mb-3"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Feed
            </button>
            <a
              href="/app/settings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              Adjust Categories
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Hide scrollbar with global styles */}
      <style jsx global>{`
        .scroll-snap-container::-webkit-scrollbar {
          display: none;
        }
        .scroll-snap-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      <div 
        ref={containerRef}
        className="scroll-snap-container h-screen overflow-y-scroll bg-[#020617]"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Floating refresh button */}
        <button
          onClick={fetchArticles}
          disabled={loading}
          className="fixed top-4 left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all group"
          title="Refresh feed"
        >
          <RefreshCw className={`h-5 w-5 text-white ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>

        {/* Articles - each is a full-screen snap point */}
        {articles.map((article, index) => (
          <div
            key={article.id}
            className="h-screen w-full relative flex flex-col"
            style={{
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {/* Image section — top 50% */}
            <div className="relative w-full flex-1 min-h-0" style={{ flex: "1 1 50%" }}>
              {article.image_url && !imgErrors.has(article.id) ? (
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={index < 3}
                  onError={() =>
                    setImgErrors((prev) => new Set(prev).add(article.id))
                  }
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(article.category)} flex items-center justify-center`}
                >
                  <span className="text-8xl opacity-20">
                    {article.category === "technology"
                      ? "⚡"
                      : article.category === "sports"
                        ? "🏆"
                        : article.category === "entertainment"
                          ? "🎬"
                          : article.category === "science"
                            ? "🔬"
                            : article.category === "health"
                              ? "❤️"
                              : article.category === "business"
                                ? "📈"
                                : article.category === "politics"
                                  ? "🏛️"
                                  : article.category === "environment"
                                    ? "🌍"
                                    : article.category === "food"
                                      ? "🍽️"
                                      : "📰"}
                  </span>
                </div>
              )}
              
              {/* Dark overlay gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Top bar: counter + time */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium">
                    {index + 1} / {articles.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-slate-300 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(article.published_at)}
                  </span>
                </div>
              </div>

              {/* Side action buttons - TikTok style */}
              <div className="absolute right-3 bottom-20 flex flex-col gap-4 z-20">
                <button
                  onClick={() => handleSave(article.id)}
                  disabled={savingIds.has(article.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                    {savedIds.has(article.id) ? (
                      <BookmarkCheck className="h-6 w-6 text-blue-400" />
                    ) : (
                      <Bookmark className="h-6 w-6 text-white group-hover:text-blue-400 transition-colors" />
                    )}
                  </div>
                  <span className="text-white text-xs font-medium">
                    {savedIds.has(article.id) ? 'Saved' : 'Save'}
                  </span>
                </button>

                <button
                  onClick={() => handleShare(article)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                    <Share2 className="h-6 w-6 text-white group-hover:text-green-400 transition-colors" />
                  </div>
                  <span className="text-white text-xs font-medium">Share</span>
                </button>
              </div>
            </div>

            {/* Content section — bottom 50% */}
            <div
              className="relative z-10 px-5 pb-5 pt-4 flex flex-col justify-between"
              style={{ flex: "1 1 50%" }}
            >
              {/* Category + Source */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wide">
                    {CATEGORY_LABELS[article.category as Category] || article.category}
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-400 text-xs font-medium truncate">
                    {article.source_name}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight mb-3 line-clamp-3">
                  {article.title}
                </h2>

                {/* Description */}
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-4">
                  {article.description}
                </p>
              </div>

              {/* Bottom actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                <a
                  href={article.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Read Full Article
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
