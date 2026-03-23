"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  ExternalLink,
  Loader2,
  Clock,
  BookmarkCheck,
} from "lucide-react";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

interface SavedItem {
  id: string;
  saved_at: string;
  article: {
    id: string;
    title: string;
    description: string;
    category: string;
    source_name: string;
    image_url: string | null;
    article_url: string;
    published_at: string;
  };
}

export default function StarredPage() {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saved");
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved || []);
      }
    } catch (err) {
      console.error("Failed to fetch saved:", err);
    }
    setLoading(false);
  };

  const handleRemove = async (articleId: string, savedId: string) => {
    setRemovingIds((prev) => new Set(prev).add(savedId));
    try {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId }),
      });
      setSaved((prev) => prev.filter((s) => s.id !== savedId));
    } catch (err) {
      console.error("Remove failed:", err);
    }
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(savedId);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-blue-400" />
          </div>
          Saved Articles
        </h1>
        <p className="text-slate-400 text-sm mt-2 ml-[52px]">
          Your saved stories from across the cosmos.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-400">Loading saved articles...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && saved.length === 0 && (
        <div className="text-center py-24">
          <Bookmark className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No saved articles yet</p>
          <p className="text-slate-500 text-sm">
            Save articles from Your Sky to find them here.
          </p>
        </div>
      )}

      {/* Saved articles list */}
      <div className="space-y-3">
        {saved.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium">
                    {CATEGORY_LABELS[item.article.category as Category] ||
                      item.article.category}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {item.article.source_name}
                  </span>
                  <span className="text-slate-600 text-xs">·</span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Saved {timeAgo(item.saved_at)}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1.5 group-hover:text-blue-300 transition-colors">
                  {item.article.title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {item.article.description}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <a
                  href={item.article.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-all"
                  title="Open article"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleRemove(item.article.id, item.id)}
                  disabled={removingIds.has(item.id)}
                  className="p-2 rounded-md hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 transition-all"
                  title="Unsave article"
                >
                  <BookmarkCheck className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
