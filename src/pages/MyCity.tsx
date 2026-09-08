import { Link } from 'react-router-dom';
import { Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useMyHome } from '@/hooks/useMyCity';
import { AddressPicker } from '@/components/my-city/AddressPicker';
import { MyCityCards } from '@/components/my-city/MyCityCards';

/**
 * My City.
 *
 * A home address is the key to the city: trash day, snow route, council
 * district, what is changing nearby. Without one there is nothing personal to
 * show, so the page asks for the address first.
 */
export default function MyCity() {
  const { user } = useAuth();
  const { data: home, isLoading } = useMyHome();

  if (!user) {
    return (
      <>
        <Header title="My City" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to set up My City</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              Add your address and get your trash day, your council district and what is
              changing on your street.
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
      <Header title="My City" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">My City</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {home ? 'Your street, your neighborhood, your city.' : 'Start with your address.'}
          </p>
        </div>

        {!isLoading && !home && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="font-heading text-base font-semibold">Where do you live?</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              We use it to show your trash day, your district and what is changing near you.
              Only you can see it.
            </p>
            <AddressPicker autoFocus />
          </div>
        )}

        <MyCityCards />

        {home && (
          <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Moved?</h2>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              Set a new address. Your old one stops following along.
            </p>
            <AddressPicker />
          </div>
        )}
      </PageContainer>
    </>
  );
}
