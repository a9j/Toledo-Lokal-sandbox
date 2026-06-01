import { useState } from 'react';
import { Share2, Link2, Facebook, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { PulsePost } from '@/hooks/usePulse';

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface PulseShareButtonProps {
  post: PulsePost;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function PulseShareButton({ 
  post,
  variant = 'ghost',
  size = 'sm',
  className
}: PulseShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  // Generate shareable URL using pulse_id
  const pulseId = (post as any).pulse_id || post.id;
  const shareUrl = `${window.location.origin}/pulse/${pulseId}`;
  
  // Generate headline from content (first sentence or up to 60 chars)
  const headline = (post as any).headline || 
    post.content.split('.')[0].substring(0, 60) + (post.content.length > 60 ? '...' : '');
  
  // Preview text for sharing
  const previewText = (post as any).preview_text || post.content.substring(0, 160);

  // Default share text template
  const shareText = `${headline}\n\nToledo locals are talking.\nJoin the Pulse`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: headline,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleSMSShare = () => {
    // iOS uses &body=, Android uses ?body=
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const smsUrl = `sms:${separator}body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.location.href = smsUrl;
  };

  // Check if share_enabled is false
  if ((post as any).share_enabled === false) {
    return null;
  }

  // Use native share on mobile if available
  if (navigator.share) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
        disabled={isSharing}
      >
        <Share2 className="h-3.5 w-3.5" />
        {size !== 'icon' && <span className="ml-1.5">Share</span>}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-3.5 w-3.5" />
          {size !== 'icon' && <span className="ml-1.5">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border border-border">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitterShare}>
          <XIcon className="h-4 w-4 mr-2" />
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSMSShare}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Text Message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
