import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Store, Users, HeartHandshake, ShieldAlert, Gift,
  Sprout, BadgeCheck, Megaphone, Building2, Shield, ChevronRight, QrCode,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LogoLoader } from '@/components/ui/logo-loader';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { LoopAnalyticsDashboard } from '@/components/admin/LoopAnalyticsDashboard';
import { UsersAdmin } from '@/components/admin/UsersAdmin';
import { NonprofitAdmin } from '@/components/admin/NonprofitAdmin';
import { AdminShell, AdminNavGroup } from '@/components/admin/console/AdminShell';
import { CityOverview } from '@/components/admin/console/CityOverview';
import { RolesAdmin } from '@/components/admin/console/RolesAdmin';
import { ModerationAdmin } from '@/components/admin/console/ModerationAdmin';
import { PulseModerationQueue } from '@/components/admin/console/PulseModerationQueue';
import { PulsePostsAdmin } from '@/components/admin/console/PulsePostsAdmin';
import { RewardsAdmin } from '@/components/admin/console/RewardsAdmin';
import { CitiesAdmin } from '@/components/admin/console/CitiesAdmin';
import { JoinQRCode } from '@/components/join/JoinQRCode';
import { siteUrl } from '@/lib/site-url';

const NAV_GROUPS: AdminNavGroup[] = [
  { label: 'City', items: [
    { id: 'overview', label: 'City Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'City Intelligence', icon: BarChart3 },
  ] },
  { label: 'Manage', items: [
    { id: 'management', label: 'Businesses & Content', icon: Store },
    { id: 'nonprofits', label: 'Nonprofits', icon: HeartHandshake },
    { id: 'users', label: 'Users', icon: Users },
  ] },
  { label: 'City Ops', items: [
    { id: 'trust', label: 'Trust & Roles', icon: BadgeCheck },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
    { id: 'rewards', label: 'Rewards & Campaigns', icon: Gift },
    { id: 'community', label: 'Community Impact', icon: Sprout, soon: true },
    { id: 'messaging', label: 'Announcements', icon: Megaphone, soon: true },
    { id: 'whitelabel', label: 'White-label Cities', icon: Building2 },
  ] },
  { label: 'Growth', items: [
    { id: 'founding-qr', label: 'Founding Partner QR', icon: QrCode },
  ] },
];

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'City Overview', subtitle: 'The digital heartbeat of Toledo' },
  analytics: { title: 'City Intelligence', subtitle: 'Engagement, growth, and Loop activity' },
  management: { title: 'Businesses & Content', subtitle: 'Approvals, listings, deals, events & more' },
  nonprofits: { title: 'Nonprofits', subtitle: 'Causes, partners, and impact' },
  users: { title: 'Users', subtitle: 'Members, roles, and reports' },
  trust: { title: 'Trust & Roles', subtitle: 'Assign roles and review permissions' },
  moderation: { title: 'Moderation', subtitle: 'Reports, content, and community trust' },
  rewards: { title: 'Rewards & Campaigns', subtitle: 'Loop campaigns and city challenges' },
  whitelabel: { title: 'White-label Cities', subtitle: 'Tenant cities and per-city branding' },
  'founding-qr': { title: 'Founding Partner QR', subtitle: 'Show or print this to recruit Founding partners' },
};

const MANAGEMENT_LINKS = [
  { label: 'Business approvals', desc: 'Approve, reject, verify, feature', to: '/admin/classic?tab=businesses' },
  { label: 'Manage listings', desc: 'Badges, tiers, neighborhoods, media', to: '/admin/classic?tab=manage' },
  { label: 'Deals', desc: 'Review and approve deals', to: '/admin/classic?tab=deals' },
  { label: 'Events', desc: 'Approve and feature events', to: '/admin/classic?tab=events' },
  { label: 'Jobs', desc: 'Moderate job postings', to: '/admin/classic?tab=jobs' },
  { label: 'Food trucks', desc: 'Routes, locations, status', to: '/admin/classic?tab=food' },
  { label: 'Full business directory', desc: 'Tier badges, messaging, archive', to: '/admin/businesses' },
];

function ManagementLauncher() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {MANAGEMENT_LINKS.map((l) => (
        <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10"><Store className="h-4 w-4 text-primary" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{l.label}</p>
            <p className="truncate text-xs text-muted-foreground">{l.desc}</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
        </Link>
      ))}
    </div>
  );
}

function FoundingQRPanel() {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="mb-6 text-sm text-muted-foreground">
        Scanning this code opens the Founding Partner page. Show it on your phone
        while talking to businesses, or download it to print and hand out.
      </p>
      <JoinQRCode url={siteUrl('/join')} />
      <Link
        to="/join/qr"
        className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Open full-screen QR page
      </Link>
    </div>
  );
}

export default function AdminConsole() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><LogoLoader size="lg" text="Loading console..." /></div>;
  }
  if (!user) {
    navigate('/auth');
    return null;
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">You don't have admin privileges.</p>
      </div>
    );
  }

  const meta = SECTION_META[active] ?? SECTION_META.overview;

  return (
    <AdminShell groups={NAV_GROUPS} active={active} onSelect={setActive} title={meta.title} subtitle={meta.subtitle}>
      {active === 'overview' && <CityOverview />}
      {active === 'analytics' && (
        <div className="space-y-6">
          <AnalyticsDashboard />
          <LoopAnalyticsDashboard />
        </div>
      )}
      {active === 'management' && <ManagementLauncher />}
      {active === 'nonprofits' && <NonprofitAdmin />}
      {active === 'users' && <UsersAdmin />}
      {active === 'trust' && <RolesAdmin />}
      {active === 'moderation' && (
        <div className="space-y-8">
          <ModerationAdmin />
          <PulseModerationQueue />
          <PulsePostsAdmin />
        </div>
      )}
      {active === 'rewards' && <RewardsAdmin />}
      {active === 'whitelabel' && <CitiesAdmin />}
      {active === 'founding-qr' && <FoundingQRPanel />}
    </AdminShell>
  );
}
