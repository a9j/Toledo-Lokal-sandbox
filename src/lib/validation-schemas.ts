import { z } from 'zod';

// ========== Content Validation Schemas ==========

// Posts
export const postSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(5000, 'Post content must be less than 5000 characters')
    .refine((val) => val.trim().length > 0, 'Post content cannot be empty'),
  post_type: z.enum(['community', 'announcement', 'question']).default('community'),
});

export type PostInput = z.infer<typeof postSchema>;

// Reviews
export const reviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .transform((val) => val?.trim() || null),
  content: z
    .string()
    .max(2000, 'Review must be less than 2000 characters')
    .optional()
    .transform((val) => val?.trim() || null),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// Pulse Posts
export const pulsePostSchema = z.object({
  category: z.enum(['right_now', 'heads_up', 'energy_check', 'community_ask', 'good_stuff']),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(140, 'Content must be 140 characters or less')
    .refine((val) => val.trim().length > 0, 'Content cannot be empty'),
  expirationHours: z
    .number()
    .int()
    .min(1, 'Expiration must be at least 1 hour')
    .max(24, 'Expiration must be at most 24 hours'),
  locationText: z
    .string()
    .max(50, 'Location must be less than 50 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
  headline: z
    .string()
    .max(60, 'Headline must be less than 60 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
  previewText: z
    .string()
    .max(160, 'Preview text must be less than 160 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
});

export type PulsePostInput = z.infer<typeof pulsePostSchema>;

// Business Hours
const dayHoursSchema = z.object({
  open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  closed: z.boolean().optional(),
});

export const businessHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
});

// Business Form
export const businessSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(200, 'Business name must be less than 200 characters')
    .refine((val) => val.trim().length > 0, 'Business name cannot be empty'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .transform((val) => val?.trim() || null),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim() || null),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .transform((val) => val?.trim() || null)
    .refine(
      (val) => !val || /^[\d\s\-+()]+$/.test(val),
      'Phone number contains invalid characters'
    ),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .max(500, 'Website URL must be less than 500 characters')
    .optional()
    .transform((val) => val?.trim() || null)
    .refine(
      (val) => !val || /^https?:\/\//.test(val) || /^[a-zA-Z0-9]/.test(val),
      'Website must be a valid URL'
    ),
  category_id: z.string().uuid('Invalid category').optional(),
  neighborhood_id: z.string().uuid('Invalid neighborhood').optional(),
  hours: businessHoursSchema.optional(),
});

export type BusinessInput = z.infer<typeof businessSchema>;

// Lead/Contact Form
export const leadSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-+()]+$/.test(val),
      'Phone number contains invalid characters'
    ),
  message: z
    .string()
    .max(1000, 'Message must be less than 1000 characters')
    .optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

// ========== Validation Utilities ==========

export function validateInput<TOut, TIn = TOut>(
  schema: z.ZodType<TOut, z.ZodTypeDef, TIn>,
  data: unknown
): { success: true; data: TOut } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return { success: false, errors };
}

// Sanitize HTML/script tags from text
export function sanitizeText(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Check for potential SQL injection patterns (extra safety layer)
export function hasSuspiciousPatterns(text: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|WHERE)\b)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b)/i,
  ];
  
  return patterns.some((pattern) => pattern.test(text));
}
