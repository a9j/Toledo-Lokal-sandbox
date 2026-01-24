/**
 * Secure error handling utility that prevents database schema leakage
 * Maps technical errors to user-friendly messages
 */

interface PostgresError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

// Common Postgres error codes mapped to user-friendly messages
const ERROR_CODE_MAP: Record<string, string> = {
  '23505': 'This item already exists',
  '23503': 'Cannot complete this action due to related data',
  '23502': 'Required information is missing',
  '42501': 'You don\'t have permission to do this',
  '42P01': 'Unable to complete request',
  'PGRST116': 'Item not found',
  'PGRST301': 'Unable to complete request',
};

// Rate limit patterns to detect
const RATE_LIMIT_PATTERNS = [
  'row-level security',
  'rate limit',
  'too many requests',
];

/**
 * Converts a database or API error to a safe, user-friendly message
 * Logs the full error for debugging while returning a sanitized message
 */
export function getSafeErrorMessage(error: unknown, fallbackMessage = 'Unable to complete request'): string {
  // Log the full error for debugging (server-side or dev console)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', error);
  }

  if (!error) {
    return fallbackMessage;
  }

  const errorObj = error as PostgresError;
  const errorMessage = errorObj?.message || '';
  const errorCode = errorObj?.code || '';

  // Check for rate limiting first
  if (RATE_LIMIT_PATTERNS.some(pattern => errorMessage.toLowerCase().includes(pattern))) {
    return 'Please slow down. Try again in a moment.';
  }

  // Check for known error codes
  if (errorCode && ERROR_CODE_MAP[errorCode]) {
    return ERROR_CODE_MAP[errorCode];
  }

  // Check for permission errors (RLS violations)
  if (errorCode === '42501' || errorMessage.includes('permission denied')) {
    return 'You don\'t have permission to do this';
  }

  // Check for auth errors
  if (errorMessage.toLowerCase().includes('jwt') || 
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.toLowerCase().includes('unauthorized')) {
    return 'Please sign in to continue';
  }

  // Check for network errors
  if (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('fetch failed') ||
      errorMessage.toLowerCase().includes('connection')) {
    return 'Network error. Please check your connection.';
  }

  // For Edge Function errors, check if it's a safe message to pass through
  if (errorMessage && !containsSensitiveInfo(errorMessage)) {
    return errorMessage;
  }

  // Default fallback
  return fallbackMessage;
}

/**
 * Checks if an error message contains potentially sensitive database information
 */
function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /violates.*constraint/i,
    /foreign key/i,
    /unique.*violation/i,
    /null value in column/i,
    /table.*does not exist/i,
    /column.*does not exist/i,
    /relation.*does not exist/i,
    /function.*does not exist/i,
    /permission denied for/i,
    /policy.*for table/i,
    /supabase/i,
    /postgres/i,
    /pgsql/i,
    /sql/i,
    /_fkey$/i,
    /_pkey$/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(message));
}

/**
 * Type-safe error handler for mutations
 * Use in onError callbacks
 */
export function handleMutationError(
  error: unknown,
  options: {
    toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => void;
    fallbackMessage?: string;
    title?: string;
  }
): void {
  const { toast, fallbackMessage, title = 'Error' } = options;
  
  toast({
    variant: 'destructive',
    title,
    description: getSafeErrorMessage(error, fallbackMessage),
  });
}

/**
 * Type-safe error handler for sonner toast
 */
export function handleSonnerError(
  error: unknown,
  toast: { error: (message: string) => void },
  fallbackMessage?: string
): void {
  toast.error(getSafeErrorMessage(error, fallbackMessage));
}
