import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Store, Users, HeartHandshake, ShieldAlert, Gift,
  Sprout, BadgeCheck, Megaphone, Building2, Shield, ChevronRight,
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
    { id: 'rewards', label: 'Rewards & Campaigns', icon: Gift, soon: true },
    { id: 'community', label: 'Community Impact', icon: Sprout, soon: true },
    { id: 'messaging', label: 'Announcements', icon: Megaphone, soon: true },
    { id: 'whitelabel', label: 'White-label Cities', icon: Building2, soon: true },
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
      {active === 'moderation' && <ModerationAdmin />}
    </AdminShell>
  );
}
