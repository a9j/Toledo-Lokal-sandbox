import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings, Bookmark, FileText, Building2, LogOut, ChevronRight, Download,
  Heart, Crown, MapPin, BadgeCheck, Mail, Shield, Scale, Trash2, QrCode,
} from 'lucide-react';
import { useActiveRole } from '@/contexts/ActiveRoleContext';
import { BusinessQRModal } from '@/components/business/BusinessQRModal';
import { InstallAppGuide } from '@/components/pwa/InstallAppGuide';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useOwnerMessages } from '@/hooks/useOwnerMessages';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { SavedPlacesList } from '@/components/profile/SavedPlacesList';
import { VibeEditor } from '@/components/profile/VibeEditor';
import { ProfileWalletCard } from '@/components/loop/ProfileWalletCard';
import { UserWalletQR } from '@/components/loop/UserWalletQR';
import { UserPulseToggle } from '@/components/pulse/UserPulseToggle';
import { useLoop } from '@/contexts/LoopContext';
import { LP_ENABLED } from '@/lib/flags';

export default function Profile() {
  const { user, signOut, isAdmin, isConnector } = useAuth();
  const { activeBusiness, businesses } = useActiveRole();
  const [showQR, setShowQR] = useState(false);
  const { isInstalled } = usePWAInstall();
  const { ensureLoaded } = useLoop();
  // Only spin up the Loop wallet when the Loop Points program is live. With the
  // flag off there is no Loop UI to feed, so skip the fetch entirely.
  useEffect(() => { if (LP_ENABLED) ensureLoaded(); }, [ensureLoaded]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { unreadCount } = useOwnerMessages();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*, neighborhood:neighborhoods(name)')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userBusiness } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return { saved: 0, supported: 0, checkins: 0 };
      const { count: saved } = await supabase
        .from('saved_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return { saved: saved ?? 0, supported: 0, checkins: 0 };
    },
    enabled: !!user,
  });

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-own-account');
      if (error) throw error;
      await signOut();
      navigate('/');
    } catch {
      setIsDeleting(false);
    }
  };
  const handleAvatarUpdate = () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

  if (!user) { navigate('/auth'); return null; }

  // `vibe` is a newly added column not yet in the generated Supabase types.
  const profileVibe = (profile as { vibe?: string[] } | null | undefined)?.vibe ?? [];

  const menuItems = [
    { icon: Heart, label: 'My Toledo', href: '/my-toledo' },
    { icon: Bookmark, label: 'Saved Places', href: '/saved' },
    { icon: FileText, label: 'My Requests', href: '/requests' },
  ];

  // Business whose QR we offer: the one picked in the account switcher, else the
  // user's own business. Stays null (item hidden) for residents with no business.
  const qrBusiness = activeBusiness ??
    businesses[0] ??
    (userBusiness ? { id: userBusiness.id, name: userBusiness.name } : null);

  const displayName = profile?.name || user.email?.split('@')[0] || 'Toledoan';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <Header title="Profile" />

      {/* Skyline hero */}
      <section className="relative">
        <div className="relative h-44 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(120% 80% at 80% 30%, hsl(28 90% 50% / 0.5) 0%, transparent 55%),
                radial-gradient(60% 60% at 20% 80%, hsl(220 70% 22% / 0.6) 0%, transparent 65%),
                linear-gradient(180deg, hsl(220 35% 8%) 0%, hsl(220 30% 5%) 100%)
              `,
            }}
          />
          <svg className="absolute bottom-0 left-0 w-full h-[60%] opacity-90" viewBox="0 0 800 300" preserveAspectRatio="none">
            <path fill="hsl(220 40% 10%)" d="M0,300 L0,210 L40,210 L40,170 L75,170 L75,195 L110,195 L110,140 L140,140 L140,165 L175,165 L175,120 L210,120 L210,90 L240,90 L240,135 L275,135 L275,105 L310,105 L310,85 L340,85 L340,140 L380,140 L380,115 L420,115 L420,80 L445,80 L445,110 L475,110 L475,150 L510,150 L510,125 L545,125 L545,170 L575,170 L575,140 L610,140 L610,180 L645,180 L645,155 L680,155 L680,195 L720,195 L720,170 L760,170 L760,210 L800,210 L800,300 Z" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
        </div>

        {/* Avatar + name overlay */}
        <div className="px-5 -mt-12 relative z-10 max-w-lg mx-auto">
          <div className="flex items-end gap-4">
            <div className="ring-4 ring-background rounded-full">
              <AvatarUpload
                currentUrl={profile?.avatar_url}
                userName={profile?.name}
                userEmail={user.email}
                userId={user.id}
                onUploadComplete={handleAvatarUpdate}
              />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <BadgeCheck className="h-5 w-5 text-primary fill-primary/20" />
              </div>
              {profile?.neighborhood?.name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {profile.neighborhood.name}, Toledo
                </p>
              )}
              {memberSince && (
                <p className="text-xs text-muted-foreground/80 mt-0.5">Member since {memberSince}</p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile-setup')}
            className="mt-4 rounded-full border-border/70 px-5"
          >
            Edit Profile
          </Button>
        </div>
      </section>

      <PageContainer className="space-y-6 pb-20 mt-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 rounded-2xl border border-border/60 bg-card divide-x divide-border/60 overflow-hidden">
          {[
            { v: stats?.saved ?? 0, l: 'Places Saved' },
            { v: stats?.supported ?? 0, l: 'Nonprofits Supported' },
            { v: stats?.checkins ?? 0, l: 'Check-ins' },
          ].map((s) => (
            <div key={s.l} className="text-center py-4 px-2">
              <div className="text-2xl font-bold text-foreground">{s.v}</div>
              <div className="text-[11px] text-muted-foreground leading-tight mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Loop Wallet Card — only when the Loop Points program is live. */}
        {LP_ENABLED && <ProfileWalletCard />}

        {/* Toledo Passport map preview */}
        <Link
          to="/my-toledo"
          className="block rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/90">
              Toledo Passport
            </h3>
            <span className="text-xs text-primary font-semibold">See all</span>
          </div>
          <div className="relative h-32 mt-3 mx-3 rounded-xl overflow-hidden bg-secondary/60">
            <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="passport-dots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="hsl(var(--muted-foreground))" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#passport-dots)" />
            </svg>
            {/* heart pins */}
            {[
              { l: '20%', t: '30%' }, { l: '38%', t: '55%' }, { l: '55%', t: '25%' },
              { l: '70%', t: '60%' }, { l: '82%', t: '35%' }, { l: '15%', t: '70%' },
            ].map((p, i) => (
              <div
                key={i}
                className="absolute w-2.5 h-3.5 rounded-full bg-primary shadow-glow-blue"
                style={{ left: p.l, top: p.t }}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 px-3 py-3 text-center">
            {[
              { v: stats?.saved ?? 0, l: 'Saved' },
              { v: 0, l: 'Bookstores' },
              { v: 0, l: 'Festivals' },
              { v: stats?.checkins ?? 0, l: 'Events' },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-base font-bold text-foreground">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </Link>

        {/* Your Vibe chips */}
        <VibeEditor userId={user.id} vibe={profileVibe} />

        {LP_ENABLED && <UserWalletQR />}
        <UserPulseToggle />

        {/* Business section */}
        {userBusiness ? (
          <div className="space-y-2">
            <Link to="/dashboard">
              <div className="card-elevated p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{userBusiness.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {userBusiness.status === 'approved' ? 'Active' : userBusiness.status} · Tap to manage
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </div>
        ) : (
          <Link to="/create-business">
            <div className="card-elevated p-4 flex items-center gap-3 border-dashed border-2">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">List Your Business</h3>
                <p className="text-sm text-muted-foreground">Get discovered by Toledo residents</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Local Favorites preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/90">Local Favorites</h3>
            <Link to="/my-toledo" className="text-xs text-primary font-semibold">See all</Link>
          </div>
          <SavedPlacesList compact maxItems={3} />
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          <Link to="/messages">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Messages</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>

          {menuItems.map(item => (
            <Link key={item.href} to={item.href}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}

          {/* Shown to anyone who owns or manages a business. */}
          {qrBusiness && (
            <button
              onClick={() => setShowQR(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <QrCode className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 font-medium">My QR Code</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          {isConnector && (
            <Link to="/connector-dashboard">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Crown className="h-5 w-5 text-lokal-gold" />
                <span className="flex-1 font-medium">Connector Hub</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">Admin Panel</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          )}

          {!isInstalled && (
            <button
              onClick={() => setShowInstallGuide(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <Download className="h-5 w-5 text-primary" />
              <span className="flex-1 font-medium">Turn this into an app</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          <Link to="/privacy">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Privacy Policy</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
          <Link to="/terms">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 font-medium">Terms of Service</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        <InstallAppGuide open={showInstallGuide} onOpenChange={setShowInstallGuide} />

        {qrBusiness && (
          <BusinessQRModal
            open={showQR}
            onOpenChange={setShowQR}
            businessId={qrBusiness.id}
            businessName={qrBusiness.name}
            userId={user.id}
            personName={displayName}
            personEmail={user.email ?? null}
          />
        )}

        <Button variant="outline" className="w-full gap-2" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>

        <Button
          variant="ghost"
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText(''); }}
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>

        <Dialog open={showDeleteDialog} onOpenChange={(o) => { if (!o) { setShowDeleteDialog(false); setDeleteConfirmText(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your account, profile, saved places, and any businesses
                you own. This cannot be undone. Type{' '}
                <span className="font-semibold text-foreground">DELETE</span> to confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mt-2"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
