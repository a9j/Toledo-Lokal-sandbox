import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffectiveBusinessRole } from '@/hooks/useEffectiveBusinessRole';
import { isOwnerOrAdmin } from '@/lib/businessPermissions';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Tag, 
  Calendar, 
  Inbox, 
  CreditCard, 
  Zap,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  QrCode,
  Gift,
  ClipboardCheck,
  Users,
  Briefcase,
  Truck,
  MapPin,
  UtensilsCrossed,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessLoopStats } from '@/components/loop/BusinessLoopStats';
import { StaffManagement } from '@/components/staff/StaffManagement';
import { LogoLoader } from '@/components/ui/logo-loader';
import {
  canHaveMenu,
  isFoodTruckCategory,
  loopEnabled,
  LOOP_UPGRADE_NUDGE,
} from '@/lib/business-access';
import { resolveBusinessCategory } from '@/lib/profile-modules';

export default function Dashboard() {
  const { user } = useAuth();
  const { ensureLoaded: ensureSubLoaded } = useSubscription();
  useEffect(() => { ensureSubLoaded(); }, [ensureSubLoaded]);
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ['user-business-full', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const businessSelect = `
          *,
          category:categories!category_id(name, icon),
          neighborhood:neighborhoods(name),
          deals(id),
          events(id),
          leads(id, status)
        `;

      // Business the user owns takes precedence.
      const { data: owned, error } = await supabase
        .from('businesses')
        .select(businessSelect)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (owned) return owned;

      // Otherwise, a business the user manages (business_staff role='manager').
      const { data: managed, error: managedError } = await supabase
        .from('business_staff')
        .select(`business:businesses(${businessSelect})`)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();

      if (managedError) throw managedError;
      return managed?.business ?? null;
    },
    enabled: !!user,
  });

  // Pending scans count — MUST be before any early returns to avoid hooks violation
  const { data: pendingScanCount } = useQuery({
    queryKey: ['pending-scan-count', business?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('loop_qr_scans')
        .select('id', { count: 'exact', head: true })
        .in('qr_code_id', 
          (await supabase.from('loop_qr_codes').select('id').eq('business_id', business!.id)).data?.map(q => q.id) || []
        )
        .eq('status', 'pending_confirmation');
      if (error) return 0;
      return count || 0;
    },
    enabled: !!business?.id,
    refetchInterval: 30000,
  });

  // Effective role on this business (owner via owner_user_id, manager via
  // business_staff, platform admin → 'admin'). Gates owner-only dashboard items.
  const { data: effectiveRole } = useEffectiveBusinessRole(business?.id);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!isLoading && user && !business) {
      navigate('/create-business');
    }
  }, [isLoading, user, business, navigate]);

  if (!user || isLoading || !business) {
    return (
      <>
        <Header title="Dashboard" />
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <LogoLoader size="lg" text="Loading your dashboard..." />
        </PageContainer>
      </>
    );
  }

  const newLeadsCount = business.leads?.filter(l => l.status === 'new').length || 0;
  // Owner-only dashboard items (staff admin, etc.) are reserved for the owner or
  // a business/platform admin — never a manager. Falls back to the literal
  // owner check while the role query is still resolving.
  const isOwner = isOwnerOrAdmin(effectiveRole) || business.owner_user_id === user.id;

  const cat = business.category as { name?: string; icon?: string | null } | null;
  const businessCategory = resolveBusinessCategory(cat?.name, cat?.icon);
  const showMenu = canHaveMenu(businessCategory);
  const showFoodTruck = isFoodTruckCategory(businessCategory);
  const showLoop = loopEnabled(business.tier_status);

  const dashboardItems = [
    {
      icon: Building2,
      label: 'Manage Business',
      href: '/manage',
      subtitle: 'Dashboard, profile, analytics, and more',
    },
    {
      icon: Building2,
      label: 'My Business Profile',
      href: `/business/${business.id}/edit`,
      subtitle: business.status === 'pending' ? 'Pending approval' : 'Active',
      badge: business.status === 'pending' ? 'warning' : undefined
    },
    { 
      icon: MapPin, 
      label: 'Locations', 
      href: '/dashboard/locations',
      subtitle: 'Manage your business locations'
    },
    {
      icon: UtensilsCrossed,
      label: 'Menu',
      href: '/dashboard/menu',
      subtitle: 'Manage your menu items',
      visible: showMenu,
    },
    {
      icon: Briefcase,
      label: 'Hiring & Jobs',
      href: '/dashboard/jobs',
      subtitle: 'Post job openings'
    },
    {
      icon: Truck,
      label: 'Food Truck Mode',
      href: '/dashboard/food-truck',
      subtitle: 'Post daily locations',
      visible: showFoodTruck,
    },
    { 
      icon: Tag, 
      label: 'My Deals', 
      href: '/dashboard/deals',
      subtitle: `${business.deals?.length || 0} deals`
    },
    { 
      icon: Calendar, 
      label: 'My Events', 
      href: '/dashboard/events',
      subtitle: `${business.events?.length || 0} events`
    },
    { 
      icon: Inbox, 
      label: 'Leads Inbox', 
      href: '/dashboard/leads',
      subtitle: `${business.leads?.length || 0} total leads`,
      badge: newLeadsCount > 0 ? 'new' : undefined,
      badgeCount: newLeadsCount
    },
    {
      icon: QrCode,
      label: 'Loop QR Codes',
      href: '/dashboard/qr-codes',
      subtitle: 'Issue points to customers',
      visible: showLoop,
    },
    {
      icon: Gift,
      label: 'Loop Rewards',
      href: '/dashboard/rewards',
      subtitle: 'Set redemption options',
      visible: showLoop,
    },
    {
      icon: ClipboardCheck,
      label: 'Pending Confirmations',
      href: '/dashboard/pending-scans',
      subtitle: (pendingScanCount || 0) > 0 ? `${pendingScanCount} awaiting confirmation` : 'No pending scans',
      badge: (pendingScanCount || 0) > 0 ? 'new' as const : undefined,
      badgeCount: pendingScanCount || 0,
      visible: showLoop,
    },
    {
      icon: Users,
      label: 'Staff & Scanners',
      href: '/dashboard/staff',
      subtitle: 'Manage who can scan',
      ownerOnly: true
    },
    { 
      icon: CreditCard, 
      label: 'Subscription & Billing', 
      href: '/dashboard/subscription',
      subtitle: business.tier_status === 'founding_5' ? 'Founding 5 — Free forever' 
        : business.tier_status === 'founding_25' ? 'Founding 25 — Launch pricing'
        : business.tier_status === 'pro' ? 'Pro / Anchor plan'
        : business.tier_status === 'growth' ? 'Growth plan'
        : 'Community — Free plan'
    },
    { 
      icon: Zap, 
      label: 'Boost a Post', 
      href: '/dashboard/boost',
      subtitle: 'Get more visibility'
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      
      <PageContainer className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="-ml-2"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Button>
          <Link to={`/business/${business.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              View My Public Profile
            </Button>
          </Link>
        </div>

        {/* Business header */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{business.name}</h2>
                {business.verified && (
                  <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {business.category?.name} · {business.neighborhood?.name}
              </p>
            </div>
          </div>
          
          {business.status === 'pending' && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-warning/10 text-warning text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>Your business is pending approval</p>
            </div>
          )}

          {/* Quick tip about photo */}
          {!business.photos?.length && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-primary/10 text-sm">
              <Camera className="h-4 w-4 text-primary shrink-0" />
              <p className="text-muted-foreground">
                Add a feed photo in <Link to={`/business/${business.id}/edit`} className="text-primary font-medium underline">My Business Profile</Link> to stand out!
              </p>
            </div>
          )}
        </div>

        {/* Loop Lokal Stats — paid plans only. Free (Community) is "Visible Only". */}
        {showLoop ? (
          <BusinessLoopStats businessId={business.id} />
        ) : (
          <Link to="/dashboard/subscription">
            <div className="card-elevated p-4 flex items-center gap-3 border-dashed border-2 hover-lift">
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{LOOP_UPGRADE_NUDGE}</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to issue points, run rewards, and join Loop missions.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Dashboard items */}
        <div className="space-y-2">
          {dashboardItems
            .filter(item => {
              const meta = item as { ownerOnly?: boolean; visible?: boolean };
              return (isOwner || !meta.ownerOnly) && meta.visible !== false;
            })
            .map(item => (
            <Link key={item.href} to={item.href}>
              <div className="card-elevated p-4 flex items-start gap-3 hover-lift">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium break-words">{item.label}</span>
                    {item.badge === 'warning' && (
                      <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px]">
                        Pending
                      </Badge>
                    )}
                    {item.badge === 'new' && item.badgeCount && (
                      <Badge variant="default" className="text-[10px] px-1.5 min-w-[20px]">
                        {item.badgeCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-tight mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
