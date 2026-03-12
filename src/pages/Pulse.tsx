import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { PulseFeed } from '@/components/pulse/PulseFeed';
import { PulseCreateForm } from '@/components/pulse/PulseCreateForm';
import { SEOHead } from '@/components/seo/SEOHead';
import { Radio, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Pulse() {
  return (
    <>
      <SEOHead
        title="The Pulse | ToledoLokal"
        description="See what's happening in Toledo right now. Real-time updates, alerts, and community moments."
      />
      <Header />
      <PageContainer>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="h-8 w-8 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-toledo-rose animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">The Pulse</h1>
                <p className="text-sm text-muted-foreground">What's happening in Toledo right now</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                  <DialogTitle>About The Pulse</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    The Pulse is a real-time, expiring activity stream that shows what is 
                    happening in Toledo right now.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">How it works</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Posts are short (140 characters max)</li>
                      <li>Posts automatically expire and disappear</li>
                      <li>No comments, no likes, no arguing</li>
                      <li>Tap "Helpful" to surface useful posts</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Categories</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Right Now</strong> – Live happenings (1-4 hours)</li>
                      <li><strong>Heads Up</strong> – Alerts & notices (4-12 hours)</li>
                      <li><strong>Energy Check</strong> – Area vibes (4 hours)</li>
                      <li><strong>Community Ask</strong> – Local help requests (24 hours)</li>
                      <li><strong>Good Stuff</strong> – Positive moments (24 hours)</li>
                    </ul>
                  </div>
                  <p className="text-xs italic">
                    The Pulse is designed to be fast, useful, and human — not social media.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Create button */}
          <div className="mb-6">
            <PulseCreateForm />
          </div>

          {/* Feed */}
          <PulseFeed />
        </div>
      </PageContainer>
    </>
  );
}
