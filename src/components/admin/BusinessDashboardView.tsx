import { useBusinessDashboard } from '@/hooks/useBusinessDashboard';
import { StatCard } from './StatCard';
import { OwnerContactQRCard } from '@/components/business/OwnerContactQRCard';
import {
  Eye,
  Bookmark,
  Globe,
  Phone,
  MapPin,
  Stamp,
  CalendarCheck,
  Tag,
  Briefcase,
  Users,
} from 'lucide-react';

interface BusinessDashboardViewProps {
  businessId: string;
  businessName: string;
}

export function BusinessDashboardView({ businessId, businessName }: BusinessDashboardViewProps) {
  const { data: stats, isLoading } = useBusinessDashboard(businessId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">{businessName}</h2>
        <p className="text-sm text-muted-foreground">Activity overview across your profile, events, deals, and passport.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Profile Views" value={stats?.profileViews ?? 0} icon={Eye} iconColor="text-blue-500" />
        <StatCard label="Saves" value={stats?.saves ?? 0} icon={Bookmark} iconColor="text-amber-500" />
        <StatCard label="Website Clicks" value={stats?.websiteClicks ?? 0} icon={Globe} iconColor="text-emerald-500" />
        <StatCard label="Phone Clicks" value={stats?.phoneClicks ?? 0} icon={Phone} iconColor="text-indigo-500" />
        <StatCard label="Direction Requests" value={stats?.directionRequests ?? 0} icon={MapPin} iconColor="text-rose-500" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Check-ins" value={stats?.checkins ?? 0} icon={Stamp} iconColor="text-purple-500" />
        <StatCard label="Event Views" value={stats?.eventViews ?? 0} icon={CalendarCheck} iconColor="text-orange-500" />
        <StatCard label="Deal Views" value={stats?.dealViews ?? 0} icon={Tag} iconColor="text-pink-500" />
        <StatCard label="Job Views" value={stats?.jobViews ?? 0} icon={Briefcase} iconColor="text-teal-500" />
        <StatCard label="Followers" value={stats?.followers ?? 0} icon={Users} iconColor="text-cyan-500" />
      </div>

      {stats && Object.values(stats).every(v => v === 0) && (
        <div className="card-elevated p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No activity yet. As visitors interact with your profile, events, and deals, your stats will appear here.
          </p>
        </div>
      )}

      {/* Owner/admin-only digital business card. Self-gates on effective role. */}
      <OwnerContactQRCard businessId={businessId} />
    </div>
  );
}
