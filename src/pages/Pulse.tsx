import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { PulseFeed } from '@/components/pulse/PulseFeed';
import { PulseCreateForm } from '@/components/pulse/PulseCreateForm';
import { CitySignalsStrip } from '@/components/pulse/CitySignalsStrip';
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
        title="Pulse | ToledoLokal"
        description="The heartbeat of Toledo. See local business activity, community movement, real moments, and live city signals — happening right now."
      />
      <Header />
      <PageContainer>
        <div className="pb-24">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="h-8 w-8 text-primary" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-toledo-rose" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Pulse</h1>
                <p className="text-sm text-muted-foreground">The heartbeat of Toledo, right now</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>About Pulse</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>Pulse is the live layer of the city — not a social feed. It's built to help you discover what's happening nearby and support local.</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">What you'll find</h4>
                    <ul className="list-inside list-disc space-y-1">
                      <li><strong>Business activity</strong> — specials, events, live music, availability</li>
                      <li><strong>Community</strong> — volunteer needs, drives, neighborhood events</li>
                      <li><strong>Local moments</strong> — small, real moments tied to places</li>
                      <li><strong>City signals</strong> — what's trending, computed from real activity</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">How it stays clean</h4>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Every post uses a structured format — no blank posting</li>
                      <li>Posts expire automatically and stay current</li>
                      <li>Lightweight, positive reactions — no comment threads</li>
                      <li>Community reporting + moderation keep it local</li>
                    </ul>
                  </div>
                  <p className="text-xs italic">Pulse should make you feel like the city is alive right now.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Live City Signals layer */}
          <div className="mb-5">
            <CitySignalsStrip />
          </div>

          {/* Composer */}
          <div className="mb-5">
            <PulseCreateForm />
          </div>

          {/* Feed */}
          <PulseFeed />
        </div>
      </PageContainer>
    </>
  );
}
