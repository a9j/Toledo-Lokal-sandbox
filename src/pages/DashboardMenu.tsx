import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MenuManager } from '@/components/business/MenuManager';
import { Button } from '@/components/ui/button';
import { LogoLoader } from '@/components/ui/logo-loader';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { canHaveMenu } from '@/lib/business-access';

export default function DashboardMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: owned } = await supabase
        .from('businesses')
        .select('id, name, category')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (owned) return owned;

      const { data: managed } = await supabase
        .from('business_staff')
        .select('business:businesses(id, name, category)')
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();
      return (managed?.business as typeof owned) ?? null;
    },
    enabled: !!user,
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading || !business) {
    return (
      <>
        <Header title="Menu" />
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <LogoLoader size="lg" text="Loading..." />
        </PageContainer>
      </>
    );
  }

  // Menu is only for food/drink businesses. Non-food businesses that reach this
  // route directly get a clear message instead of the menu editor.
  const menuAllowed = canHaveMenu(business.category);

  return (
    <>
      <Header title="Menu" />
      <PageContainer className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        {menuAllowed ? (
          <>
            <div className="card-elevated p-4">
              <h2 className="font-semibold">{business.name}</h2>
              <p className="text-sm text-muted-foreground">
                Manage your menu items, prices, and availability
              </p>
            </div>

            <MenuManager businessId={business.id} />
          </>
        ) : (
          <div className="card-elevated p-6 text-center space-y-2">
            <UtensilsCrossed className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <h2 className="font-semibold">Menus aren't available for this business type</h2>
            <p className="text-sm text-muted-foreground">
              The Menu tool is for food &amp; drink businesses like restaurants and food trucks.
            </p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
