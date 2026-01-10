import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
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
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessLoopStats } from '@/components/loop/BusinessLoopStats';
import { StaffManagement } from '@/components/staff/StaffManagement';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ['user-business-full', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          category:categories(name),
          neighborhood:neighborhoods(name),
          deals(id),
          events(id),
          leads(id, status)
        `)
        .eq('owner_user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <PageContainer>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-secondary rounded-2xl" />
            <div className="h-20 bg-secondary rounded-2xl" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!business) {
    navigate('/create-business');
    return null;
  }

  const newLeadsCount = business.leads?.filter(l => l.status === 'new').length || 0;

  const dashboardItems = [
    { 
      icon: Building2, 
      label: 'My Business Profile', 
      href: `/business/${business.id}/edit`,
      subtitle: business.status === 'pending' ? 'Pending approval' : 'Active',
      badge: business.status === 'pending' ? 'warning' : undefined
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
      subtitle: 'Issue points to customers'
    },
    { 
      icon: Gift, 
      label: 'Loop Rewards', 
      href: '/dashboard/rewards',
      subtitle: 'Set redemption options'
    },
    { 
      icon: ClipboardCheck, 
      label: 'Pending Confirmations', 
      href: '/dashboard/pending-scans',
      subtitle: 'Confirm customer scans'
    },
    { 
      icon: Users, 
      label: 'Staff & Scanners', 
      href: '/dashboard/staff',
      subtitle: 'Manage who can scan'
    },
    { 
      icon: CreditCard, 
      label: 'Subscription & Billing', 
      href: '/dashboard/subscription',
      subtitle: 'Free plan'
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="-ml-2"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Profile
        </Button>

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
        </div>

        {/* Loop Lokal Stats */}
        <BusinessLoopStats businessId={business.id} />

        {/* Dashboard items */}
        <div className="space-y-2">
          {dashboardItems.map(item => (
            <Link key={item.href} to={item.href}>
              <div className="card-elevated p-4 flex items-center gap-3 hover-lift">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
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
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
