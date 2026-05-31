import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminShell, type AdminNavGroup } from '@/components/admin/console/AdminShell';
import { BusinessDashboardView } from '@/components/admin/BusinessDashboardView';
import { BusinessProfileEditor } from '@/components/admin/BusinessProfileEditor';
import { PulseManager } from '@/components/admin/PulseManager';
import { LogoLoader } from '@/components/ui/logo-loader';
import {
  LayoutDashboard,
  User,
  Activity,
  CalendarDays,
  Tag,
  Stamp,
  Users,
  Briefcase,
  Heart,
  BarChart3,
  Shield,
  CreditCard,
} from 'lucide-react';

const NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'profile', label: 'Profile', icon: User },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'pulse', label: 'Pulse', icon: Activity },
      { id: 'events', label: 'Events', icon: CalendarDays, soon: true },
      { id: 'deals', label: 'Deals', icon: Tag, soon: true },
      { id: 'passport', label: 'Passport', icon: Stamp, soon: true },
      { id: 'jobs', label: 'Jobs', icon: Briefcase, soon: true },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'followers', label: 'Followers', icon: Users, soon: true },
      { id: 'impact', label: 'Impact', icon: Heart, soon: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, soon: true },
      { id: 'team', label: 'Team', icon: Shield, soon: true },
      { id: 'billing', label: 'Billing', icon: CreditCard, soon: true },
    ],
  },
];

const SECTION_TITLES: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your business at a glance' },
  profile: { title: 'Profile', subtitle: 'Edit your public listing' },
  pulse: { title: 'Pulse', subtitle: 'Share updates with your community' },
  events: { title: 'Events', subtitle: 'Manage your events and classes' },
  deals: { title: 'Deals', subtitle: 'Create and track deals' },
  passport: { title: 'Passport', subtitle: 'Check-ins, stamps, and rewards' },
  followers: { title: 'Followers', subtitle: 'Your audience and announcements' },
  jobs: { title: 'Jobs', subtitle: 'Post jobs and opportunities' },
  impact: { title: 'Impact', subtitle: 'Track your community impact' },
  analytics: { title: 'Analytics', subtitle: 'Deep dive into your metrics' },
  team: { title: 'Team', subtitle: 'Manage team members and permissions' },
  billing: { title: 'Billing', subtitle: 'Your plan and payment details' },
};

export default function BusinessAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('dashboard');

  const { data: business, isLoading } = useQuery({
    queryKey: ['manage-user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: owned } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (owned) return owned;

      const { data: staffed } = await supabase
        .from('business_staff')
        .select('business_id, businesses:business_id(id, name)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (staffed?.businesses) {
        const biz = staffed.businesses as unknown as { id: string; name: string };
        return biz;
      }

      return null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !business && user) {
      navigate('/dashboard');
    }
  }, [business, isLoading, user, navigate]);

  if (isLoading || !business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoLoader size="lg" text="Loading your business..." />
      </div>
    );
  }

  const current = SECTION_TITLES[section] || SECTION_TITLES.dashboard;

  const renderContent = () => {
    switch (section) {
      case 'dashboard':
        return <BusinessDashboardView businessId={business.id} businessName={business.name} />;
      case 'profile':
        return <BusinessProfileEditor businessId={business.id} />;
      case 'pulse':
        return <PulseManager businessId={business.id} />;
      default:
        return (
          <div className="card-elevated p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {current.title} is coming soon. This section will be available in a future update.
            </p>
          </div>
        );
    }
  };

  return (
    <AdminShell
      groups={NAV_GROUPS}
      active={section}
      onSelect={setSection}
      title={current.title}
      subtitle={current.subtitle}
    >
      {renderContent()}
    </AdminShell>
  );
}
