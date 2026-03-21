import { z } from "zod";
import { CATEGORIES, DURATIONS } from "./types";

/**
 * SECURITY: Input validation schemas following OWASP best practices
 * - Strict type checking
 * - Length limits to prevent DoS
 * - Whitelist-based validation (enums)
 * - Reject unexpected fields with .strict()
 * - Sanitize string inputs
 */

// SECURITY: Sanitize string input to prevent XSS/injection
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 1000); // Hard limit to prevent DoS
};

// SECURITY: UUID validation with strict format
const uuidSchema = z.string().uuid("Invalid UUID format");

// SECURITY: Strict category validation (whitelist only)
const categorySchema = z.enum(CATEGORIES);

export const digestRequestSchema = z
  .object({
    duration: z.enum(["10", "20", "30"]).transform(Number) as unknown as z.ZodNumber,
    categories: z
      .array(categorySchema)
      .min(1, "Select at least one category")
      .max(5, "Maximum 5 categories"),
    include_local: z.boolean().optional().default(false),
    mode: z.enum(["read", "listen"]).default("read"),
  })
  .strict(); // SECURITY: Reject unexpected fields

export const digestRequestSchemaRefined = z
  .object({
    duration: z
      .number()
      .int("Duration must be an integer")
      .refine((v) => DURATIONS.includes(v as 10 | 20 | 30), {
        message: "Duration must be 10, 20, or 30",
      }),
    categories: z
      .array(z.string().max(50))
      .min(1, "Select at least one category")
      .max(5, "Maximum 5 categories")
      .transform((cats) => cats.map(sanitizeString)),
    include_local: z.boolean().optional().default(false),
    mode: z.enum(["read", "listen"]).default("read"),
  })
  .strict(); // SECURITY: Reject unexpected fields

export const preferencesSchema = z
  .object({
    categories: z
      .array(z.string().max(50))
      .min(1, "Select at least one category")
      .max(10, "Maximum 10 categories")
      .transform((cats) => cats.map(sanitizeString)),
    countries: z
      .array(z.string().length(2, "Country code must be 2 characters"))
      .max(5, "Maximum 5 countries")
      .optional()
      .default([]),
    languages: z
      .array(z.string().length(2, "Language code must be 2 characters"))
      .max(3, "Maximum 3 languages")
      .optional()
      .default(["en"]),
    keywords: z
      .array(
        z
          .string()
          .min(1, "Keyword cannot be empty")
          .max(50, "Keyword too long")
          .transform(sanitizeString)
      )
      .max(10, "Maximum 10 keywords")
      .optional()
      .default([]),
    max_recency_hours: z
      .number()
      .int("Must be an integer")
      .min(1, "Minimum 1 hour")
      .max(72, "Maximum 72 hours")
      .optional()
      .default(24),
    sentiment_mode: z
      .enum(["any", "positive_only", "mix"])
      .optional()
      .default("any"),
    include_local: z.boolean().optional().default(false),
  })
  .strict(); // SECURITY: Reject unexpected fields

export const savedArticleSchema = z
  .object({
    article_id: uuidSchema,
  })
  .strict(); // SECURITY: Reject unexpected fields

export const interactionSchema = z
  .object({
    article_id: uuidSchema,
    interaction_type: z.enum(["view", "save", "share", "skip"]),
  })
  .strict(); // SECURITY: Reject unexpected fields

export const ttsRequestSchema = z
  .object({
    digest_id: uuidSchema,
  })
  .strict(); // SECURITY: Reject unexpected fields

// SECURITY: Radio script generation validation
export const radioScriptRequestSchema = z
  .object({
    digest_id: uuidSchema,
  })
  .strict(); // SECURITY: Reject unexpected fields

// SECURITY: Cron endpoint validation (secret-based auth)
export const cronSecretSchema = z
  .object({
    secret: z
      .string()
      .min(10, "Invalid secret")
      .max(100, "Invalid secret"),
  })
  .strict();
