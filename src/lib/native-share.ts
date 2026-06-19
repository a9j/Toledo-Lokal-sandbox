import { Capacitor } from '@capacitor/core';

export interface SharePayload {
  title?: string;
  text?: string;
  url: string;
}

// Shares a link using the phone's native share sheet. On a Capacitor build we
// use the Share plugin; on the web we fall back to navigator.share, and if that
// is missing too we copy the link to the clipboard so nothing is lost.
export async function shareLink(data: SharePayload): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
        dialogTitle: data.title,
      });
      return;
    } catch {
      // Fall through to the web share path.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
    } catch {
      // User cancelled or the share failed; nothing else to do.
    }
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(data.url);
  }
}
