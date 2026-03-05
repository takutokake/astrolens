"use client";
import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Article, User } from "@/lib/types";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { motion } from "framer-motion";
import {
  RefreshCw,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function YourSkyPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
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
    // Get user profile
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

  const handleSave = async (articleId: string) => {
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
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(articleId);
      return next;
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Sky</h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.categories?.length
              ? `Tracking: ${user.categories.map((c) => CATEGORY_LABELS[c as Category] || c).join(", ")}`
              : "Your personalized news feed"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchArticles}
          disabled={loading}
          className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Loading state */}
      {loading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-400">Scanning the cosmos for stories...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-slate-400 text-lg mb-2">No stories found</p>
          {user && user.categories.length === 0 ? (
            <div>
              <p className="text-slate-500 text-sm mb-4">
                You haven&apos;t selected any categories yet.
              </p>
              <a href="/app/settings">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                  Select Categories
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              Try refreshing or check your NewsData.io API key configuration.
            </p>
          )}
        </div>
      )}

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
          >
            {/* Category + source */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                {CATEGORY_LABELS[article.category as Category] || article.category}
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs">{article.source_name}</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(article.published_at)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-white font-semibold mb-2 leading-snug group-hover:text-blue-300 transition-colors">
              {article.title}
            </h3>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4">
              {article.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={article.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Read full article
              </a>
              <div className="flex-1" />
              <button
                onClick={() => handleSave(article.id)}
                disabled={savingIds.has(article.id)}
                className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-amber-400 transition-all"
                title="Save article"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-all"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
