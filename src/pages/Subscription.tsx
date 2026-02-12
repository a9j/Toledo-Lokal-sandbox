import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';

export default function Subscription() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshSubscription, ensureLoaded } = useSubscription();
  const { toast } = useToast();
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  useEffect(() => {
    const status = searchParams.get('subscription');
    
    if (status === 'success') {
      toast({
        title: "Subscription activated!",
        description: "Thank you for supporting local Toledo businesses.",
      });
      refreshSubscription();
      setSearchParams({});
    } else if (status === 'canceled') {
      toast({
        title: "Checkout canceled",
        description: "You can upgrade anytime when you're ready.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refreshSubscription, toast]);

  return (
    <>
      <Header />
      <main className="min-h-[100dvh] w-full max-w-6xl mx-auto px-4 py-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <div className="py-6 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Business Membership Plans</h1>
            <p className="text-muted-foreground">
              Choose the plan that fits your business. Upgrade anytime to unlock more features and visibility.
            </p>
          </div>
          
          <SubscriptionManager />
        </div>
      </main>
    </>
  );
}
