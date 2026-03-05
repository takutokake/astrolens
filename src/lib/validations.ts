import { z } from "zod";
import { CATEGORIES, DURATIONS } from "./types";

export const digestRequestSchema = z.object({
  duration: z.enum(["10", "20", "30"]).transform(Number) as unknown as z.ZodNumber,
  categories: z
    .array(z.enum(CATEGORIES))
    .min(1, "Select at least one category")
    .max(5, "Maximum 5 categories"),
  include_local: z.boolean().optional().default(false),
  mode: z.enum(["read", "listen"]).default("read"),
});

export const digestRequestSchemaRefined = z.object({
  duration: z.number().refine((v) => DURATIONS.includes(v as 10 | 20 | 30), {
    message: "Duration must be 10, 20, or 30",
  }),
  categories: z
    .array(z.string())
    .min(1, "Select at least one category")
    .max(5, "Maximum 5 categories"),
  include_local: z.boolean().optional().default(false),
  mode: z.enum(["read", "listen"]).default("read"),
});

export const preferencesSchema = z.object({
  categories: z
    .array(z.string())
    .min(1, "Select at least one category")
    .max(10),
  countries: z.array(z.string()).max(5).optional().default([]),
  languages: z.array(z.string()).max(3).optional().default(["en"]),
  keywords: z
    .array(z.string().max(50))
    .max(10)
    .optional()
    .default([]),
  max_recency_hours: z.number().min(1).max(72).optional().default(24),
  sentiment_mode: z.enum(["any", "positive_only", "mix"]).optional().default("any"),
  include_local: z.boolean().optional().default(false),
});

export const savedArticleSchema = z.object({
  article_id: z.string().uuid(),
});

export const interactionSchema = z.object({
  article_id: z.string().uuid(),
  interaction_type: z.enum(["view", "save", "share", "skip"]),
});

export const ttsRequestSchema = z.object({
  digest_id: z.string().uuid(),
});
