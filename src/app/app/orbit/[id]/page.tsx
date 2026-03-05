"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import type { Article, Digest } from "@/lib/types";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Bookmark,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  Headphones,
  Volume2,
} from "lucide-react";
import Link from "next/link";

export default function DigestViewPage() {
  const params = useParams();
  const digestId = params.id as string;

  const [digest, setDigest] = useState<Digest | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Try sessionStorage first
    const cached = sessionStorage.getItem("currentDigest");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.digest?.id === digestId) {
          setDigest(data.digest);
          setArticles(data.articles || []);
          setAudioUrl(data.digest.audio_url || null);
          setLoading(false);
          sessionStorage.removeItem("currentDigest");
          return;
        }
      } catch {}
    }

    // Fallback: fetch from API
    fetch(`/api/digest`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.digests?.find(
          (d: Digest) => d.id === digestId
        );
        if (found) {
          setDigest(found);
          setAudioUrl(found.audio_url || null);
        }
        setLoading(false);
      });
  }, [digestId]);

  const handleGenerateAudio = async () => {
    setGeneratingAudio(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest_id: digestId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAudioUrl(data.audio_url);
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
    setGeneratingAudio(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading your orbit...</p>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400 text-lg mb-4">Orbit not found</p>
        <Link href="/app/orbit">
          <Button variant="outline" className="border-white/10 text-slate-300">
            Create a new orbit
          </Button>
        </Link>
      </div>
    );
  }

  // Group articles by category
  const grouped: Record<string, Article[]> = {};
  articles.forEach((a) => {
    const cat = a.category || "world";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Digest header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            {digest.duration} min orbit
          </div>
          <span className="text-slate-500 text-xs">
            {new Date(digest.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Your Orbit</h1>
        <p className="text-slate-400 text-sm">
          {articles.length} stories · {digest.word_count.toLocaleString()} words ·{" "}
          {digest.categories
            .map((c) => CATEGORY_LABELS[c as Category] || c)
            .join(", ")}
        </p>
      </div>

      {/* Audio player */}
      {audioUrl ? (
        <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border border-blue-500/10">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={(e) =>
              setCurrentTime((e.target as HTMLAudioElement).currentTime)
            }
            onLoadedMetadata={(e) =>
              setDuration((e.target as HTMLAudioElement).duration)
            }
            onEnded={() => setPlaying(false)}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                className="p-2 text-slate-400 hover:text-white transition-colors"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime -= 15;
                }}
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors"
              >
                {playing ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white ml-0.5" />
                )}
              </button>
              <button
                className="p-2 text-slate-400 hover:text-white transition-colors"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime += 15;
                }}
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-1">
              <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  if (!audioRef.current || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = pct * duration;
                }}
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <button
              onClick={cycleSpeed}
              className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {playbackRate}×
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <Button
            onClick={handleGenerateAudio}
            disabled={generatingAudio}
            variant="outline"
            className="gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
          >
            {generatingAudio ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating audio...
              </>
            ) : (
              <>
                <Headphones className="h-4 w-4" />
                Generate Audio
              </>
            )}
          </Button>
        </div>
      )}

      {/* Articles by category */}
      {Object.entries(grouped).map(([category, catArticles]) => (
        <div key={category} className="mb-8">
          <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {CATEGORY_LABELS[category as Category] || category}
          </h2>
          <div className="space-y-3">
            {catArticles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <h3 className="text-white font-medium mb-1.5">
                  {article.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                  {article.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{article.source_name}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.ceil(
                      (article.description || "").split(/\s+/).length / 200
                    )}{" "}
                    min read
                  </span>
                  <div className="flex-1" />
                  <a
                    href={article.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Full article
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* If no articles loaded (came from history) */}
      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            Article details are not available for past orbits viewed from
            history.
          </p>
        </div>
      )}
    </div>
  );
}
