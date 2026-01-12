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

interface ModerateOptions {
  text?: string;
  imageUrl?: string;
  /**
   * If true, fail closed (block content) when moderation service is unavailable.
   * Use for critical content like reviews, business listings.
   * Default: false (fail open for non-critical content like posts)
   */
  failClosed?: boolean;
}

export async function moderateContent(options: ModerateOptions): Promise<ModerationResult> {
  const { text, imageUrl, failClosed = false } = options;

  const { data, error } = await supabase.functions.invoke('moderate-content', {
    body: { text, imageUrl },
  });

  if (error) {
    console.error('Content moderation error:', error);
    
    if (failClosed) {
      // For critical content, block when moderation fails
      return { 
        safe: false, 
        flaggedReasons: ['Unable to verify content safety - please try again'] 
      };
    }
    
    // For non-critical content, allow but log
    return { safe: true, flaggedReasons: [] };
  }

  return data as ModerationResult;
}

// Moderate text content before submission (for posts, reviews, etc.)
export async function moderateTextContent(
  text: string, 
  options: { failClosed?: boolean } = {}
): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { safe: true, flaggedReasons: [] };
  }
  
  return moderateContent({ text, failClosed: options.failClosed });
}

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const matches = text.match(hashtagRegex) || [];
  // Remove the # prefix and deduplicate
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}
