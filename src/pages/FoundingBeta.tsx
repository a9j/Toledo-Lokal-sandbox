import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, Lightbulb, Briefcase, Lock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useFoundingBeta, useBetaPhase } from '@/hooks/useBeta';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { LogoLoader } from '@/components/ui/logo-loader';
import { BetaChat } from '@/components/beta/BetaChat';
import { BetaIdeas } from '@/components/beta/BetaIdeas';
import { BetaJobs } from '@/components/beta/BetaJobs';

// The Founding Beta Circle. A hidden, invite-only Circle gated to active beta
// members (enforced in RLS). Non-members never reach the content; members see a
// holding state until the admin flips the beta phase to cohort_live.
export default function FoundingBeta() {
  const { user, isLoading: authLoading } = useAuth();
  const { isMember, isLoading, cohort, memberCount } = useFoundingBeta();
  const { data: phase, isLoading: phaseLoading } = useBetaPhase();

  if (authLoading || isLoading || phaseLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoLoader size="lg" />
      </div>
    );
  }

  // Not signed in or not an active member → invite-only message. No way to
  // request to join from here; membership comes only through the invite flow.
  if (!user || !isMember) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased">
        <Header showBack />
        <SEOHead title="Founding Beta" url="/founding-beta" noindex />
        <div className="mx-auto flex min-h-[80svh] max-w-md flex-col items-center justify-center px-6 text-center">
          <Lock className="mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Founding Beta is invite only</h1>
          <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
            This space is just for our founding beta members. If you signed up early,
            watch your email for your invite the day the app clears review.
          </p>
          {!user && (
            <Button asChild variant="secondary" className="mt-6 rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Member, but the cohort is not live yet → holding state.
  if (phase !== 'cohort_live') {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased">
        <Header showBack />
        <SEOHead title="Founding Beta" url="/founding-beta" noindex />
        <div className="mx-auto flex min-h-[80svh] max-w-md flex-col items-center justify-center px-6 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-lokal-gold" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">You're in.</h1>
          <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
            Your founding beta spot is saved. The cohort opens the day the app clears
            review. You'll get an email, and this space will come alive.
          </p>
        </div>
      </div>
    );
  }

  // Member + cohort_live → the full Circle.
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Header showBack />
      <SEOHead title="Founding Beta" url="/founding-beta" noindex />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            Private cohort{memberCount > 0 ? ` · ${memberCount} members` : ''}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {cohort?.name ?? 'Founding Beta'}
          </h1>
          {cohort?.mission && (
            <p className="mx-auto mt-2 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
              {cohort.mission}
            </p>
          )}
        </header>

        <Tabs defaultValue="chat" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex-1 gap-1.5">
              <Lightbulb className="h-4 w-4" /> Ideas
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 gap-1.5">
              <Briefcase className="h-4 w-4" /> Jobs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="pt-4"><BetaChat /></TabsContent>
          <TabsContent value="ideas" className="pt-4"><BetaIdeas /></TabsContent>
          <TabsContent value="jobs" className="pt-4"><BetaJobs /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
