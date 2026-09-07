import { Link } from 'react-router-dom';
import { Sparkles, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useMyHome } from '@/hooks/useMyCity';
import { AskToledoPanel } from '@/components/city-os/AskToledoPanel';

/**
 * Ask Toledo.
 *
 * One question box over the whole CityGraph. It answers from what is listed in
 * Toledo Lokal and says so when nothing matches, rather than filling the gap
 * with something that sounds right.
 */
export default function AskToledo() {
  const { user } = useAuth();
  const { data: home } = useMyHome();

  if (!user) {
    return (
      <>
        <Header title="Ask Toledo" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to ask Toledo</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              Ask about places, events, jobs and what is changing near you.
            </p>
            <Button asChild className="mt-5">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Ask Toledo" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Ask Toledo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Answers come from what is listed in Toledo Lokal, not from the open web.
          </p>
        </div>

        <AskToledoPanel />

        {!home && (
          <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Set your address for better answers</h2>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              With a home address, "near me" means near you and answers come back sorted by
              distance.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/my-city">Set up My City</Link>
            </Button>
          </div>
        )}
      </PageContainer>
    </>
  );
}
