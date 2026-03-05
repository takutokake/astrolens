// Database row types matching the Supabase schema

export interface User {
  id: string;
  email: string;
  name: string | null;
  categories: string[];
  location: string | null;
  premium_tier: "free" | "premium" | "premium_plus";
  countries: string[];
  languages: string[];
  keywords: string[];
  max_recency_hours: number;
  sentiment_mode: "any" | "positive_only" | "mix";
  include_local: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  article_id: string;
  title: string;
  description: string;
  content: string | null;
  category: string;
  source_name: string;
  source_id: string | null;
  image_url: string | null;
  article_url: string;
  published_at: string;
  country: string | null;
  language: string;
  sentiment: string | null;
  ai_summary: string | null;
  cache_key: string | null;
  created_at: string;
}

export interface ArticleCacheMetadata {
  id: string;
  cache_key: string;
  categories: string[];
  countries: string[];
  languages: string[];
  last_fetched_at: string;
  article_count: number;
  created_at: string;
}

export interface Digest {
  id: string;
  user_id: string;
  duration: 10 | 20 | 30;
  categories: string[];
  article_ids: string[];
  word_count: number;
  audio_url: string | null;
  created_at: string;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  article_id: string;
  saved_at: string;
}

export interface ApiUsage {
  id: string;
  user_id: string | null;
  ip_hash: string | null;
  route: string;
  count: number;
  window_start: string;
}

export interface UserArticleInteraction {
  id: string;
  user_id: string;
  article_id: string;
  interaction_type: "view" | "save" | "share" | "skip";
  created_at: string;
}

// API response types

export interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string[];
  source_name: string;
  source_id: string | null;
  image_url: string | null;
  link: string;
  pubDate: string;
  country: string[];
  language: string;
  sentiment: string | null;
}

export interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
  nextPage?: string;
}

// App constants

export const CATEGORIES = [
  "politics",
  "sports",
  "entertainment",
  "technology",
  "business",
  "science",
  "health",
  "world",
  "environment",
  "food",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  politics: "Politics",
  sports: "Sports",
  entertainment: "Entertainment",
  technology: "Technology",
  business: "Business",
  science: "Science",
  health: "Health",
  world: "World",
  environment: "Environment",
  food: "Food",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  politics: "Landmark",
  sports: "Trophy",
  entertainment: "Film",
  technology: "Cpu",
  business: "TrendingUp",
  science: "Atom",
  health: "Heart",
  world: "Globe",
  environment: "Leaf",
  food: "UtensilsCrossed",
};

export const DURATIONS = [10, 20, 30] as const;
export type Duration = (typeof DURATIONS)[number];

export const WORDS_PER_MINUTE = 200;

export function getTargetWordCount(duration: Duration): number {
  return duration * WORDS_PER_MINUTE;
}

export function getTargetArticleCount(duration: Duration): { min: number; max: number } {
  const map: Record<Duration, { min: number; max: number }> = {
    10: { min: 8, max: 10 },
    20: { min: 15, max: 20 },
    30: { min: 25, max: 30 },
  };
  return map[duration];
}
