import { supabase } from '@/integrations/supabase/client';

interface CacheEntry {
  signedUrl: string;
  expiresAt: number;
}

// In-memory cache for signed URLs
const imageCache = new Map<string, CacheEntry>();
const CACHE_BUFFER_MS = 5 * 60 * 1000; // 5 min buffer before expiry

// Pending batch requests to dedupe
const pendingBatch = new Map<string, Promise<string | null>>();
let batchQueue: string[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const BATCH_DELAY_MS = 50; // Wait 50ms to collect batch requests
const MAX_BATCH_SIZE = 20;

// Check if URL is external (Unsplash, etc.) or a public Supabase storage URL
export function isExternalUrl(url: string): boolean {
  if (!url.startsWith('http')) return false;
  if (!url.includes('supabase.co')) return true;
  if (url.includes('/storage/v1/object/public/')) return true;
  return false;
}

// Check if this is a storage path (not a full URL)
export function isStoragePath(path: string): boolean {
  return !path.startsWith('http') && !path.startsWith('data:');
}

// Check if already a signed URL
export function isSignedUrl(url: string): boolean {
  return url.includes('/storage/v1/object/sign/');
}

// Get cached URL if still valid
export function getCachedUrl(filePath: string): string | null {
  const entry = imageCache.get(filePath);
  if (!entry) return null;
  if (Date.now() < entry.expiresAt - CACHE_BUFFER_MS) {
    return entry.signedUrl;
  }
  imageCache.delete(filePath);
  return null;
}

// Store URL in cache
export function setCachedUrl(filePath: string, signedUrl: string, expiresInSeconds: number): void {
  imageCache.set(filePath, {
    signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

// Prefetch multiple URLs at once - call this proactively
export async function prefetchSignedUrls(filePaths: string[]): Promise<void> {
  // Filter out already cached and external URLs
  const pathsToFetch = filePaths.filter(path => {
    if (!path || isExternalUrl(path) || isSignedUrl(path)) return false;
    const actualPath = isStoragePath(path) ? path : extractPathFromUrl(path);
    if (!actualPath) return false;
    return !getCachedUrl(actualPath);
  }).map(path => isStoragePath(path) ? path : extractPathFromUrl(path)!);

  if (pathsToFetch.length === 0) return;

  try {
    const { data, error } = await supabase.functions.invoke('get-signed-urls-batch', {
      body: { filePaths: pathsToFetch, expiresIn: 3600 }
    });

    if (error || !data?.signedUrls) {
      console.error('Failed to batch prefetch signed URLs:', error);
      return;
    }

    // Cache all results
    for (const [path, url] of Object.entries(data.signedUrls)) {
      if (url) {
        setCachedUrl(path, url as string, 3600);
      }
    }
  } catch (err) {
    console.error('Error prefetching signed URLs:', err);
  }
}

// Extract file path from Supabase storage URL
export function extractPathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

// Process batch of queued requests
async function processBatch(): Promise<void> {
  if (batchQueue.length === 0) return;

  const paths = [...new Set(batchQueue)]; // Dedupe
  batchQueue = [];
  batchTimeout = null;

  try {
    const { data, error } = await supabase.functions.invoke('get-signed-urls-batch', {
      body: { filePaths: paths.slice(0, MAX_BATCH_SIZE), expiresIn: 3600 }
    });

    if (error || !data?.signedUrls) {
      console.error('Batch fetch failed:', error);
      // Resolve all pending with null
      for (const path of paths) {
        const resolver = pendingBatch.get(path);
        if (resolver) {
          pendingBatch.delete(path);
        }
      }
      return;
    }

    // Cache and resolve all
    for (const [path, url] of Object.entries(data.signedUrls)) {
      if (url) {
        setCachedUrl(path, url as string, 3600);
      }
      pendingBatch.delete(path);
    }
  } catch (err) {
    console.error('Error processing batch:', err);
    for (const path of paths) {
      pendingBatch.delete(path);
    }
  }
}

// Get signed URL with automatic batching
export function getSignedUrl(filePath: string): Promise<string | null> {
  // Check cache first
  const cached = getCachedUrl(filePath);
  if (cached) return Promise.resolve(cached);

  // Check if already pending
  const existing = pendingBatch.get(filePath);
  if (existing) return existing;

  // Create promise and add to batch queue
  const promise = new Promise<string | null>((resolve) => {
    batchQueue.push(filePath);

    // Set up batch processing
    if (!batchTimeout) {
      batchTimeout = setTimeout(async () => {
        await processBatch();
        // Resolve with cached value after batch processes
        resolve(getCachedUrl(filePath));
      }, BATCH_DELAY_MS);
    } else {
      // Will be resolved when batch processes
      const checkResolved = () => {
        const url = getCachedUrl(filePath);
        if (url || !pendingBatch.has(filePath)) {
          resolve(url);
        } else {
          setTimeout(checkResolved, 50);
        }
      };
      setTimeout(checkResolved, BATCH_DELAY_MS + 100);
    }
  });

  pendingBatch.set(filePath, promise);
  return promise;
}

// Preload an image into browser cache
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

// Clear all cached URLs (useful for logout)
export function clearImageCache(): void {
  imageCache.clear();
}
