import { supabase } from '@/integrations/supabase/client';

interface ModerationResult {
  safe: boolean;
  flaggedReasons: string[];
  textAnalysis?: {
    safe: boolean;
    issues: string[];
  };
  imageAnalysis?: {
    safe: boolean;
    issues: string[];
  };
}

export async function moderateContent(options: {
  text?: string;
  imageUrl?: string;
}): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke('moderate-content', {
    body: options,
  });

  if (error) {
    console.error('Content moderation error:', error);
    // Default to safe if moderation fails (don't block users)
    return { safe: true, flaggedReasons: [] };
  }

  return data as ModerationResult;
}

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const matches = text.match(hashtagRegex) || [];
  // Remove the # prefix and deduplicate
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}
