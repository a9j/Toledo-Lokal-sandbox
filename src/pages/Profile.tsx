import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, Bookmark, FileText, Building2, LogOut, ChevronRight, Download, Share, Heart, Crown } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { SavedPlacesList } from '@/components/profile/SavedPlacesList';
import { ProfileLoopSection } from '@/components/loop/ProfileLoopSection';
import { UserWalletQR } from '@/components/loop/UserWalletQR';
import { UserPulseToggle } from '@/components/pulse/UserPulseToggle';
import { useLoop } from '@/contexts/LoopContext';

export default function Profile() {
  const { user, signOut, isAdmin, isBusiness, isConnector } = useAuth();
  const { ensureLoaded } = useLoop();
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  const navigate = useNavigate();
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
    }
  };

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const queryClient = useQueryClient();

  const menuItems = [
    { icon: Heart, label: 'My Toledo', href: '/my-toledo' },
    { icon: Bookmark, label: 'Saved Places', href: '/saved' },
    { icon: FileText, label: 'My Requests', href: '/requests' },
  ];

  const handleAvatarUpdate = (newUrl: string) => {
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
  };

  return (
    <>
      <Header title="Profile" />
      
      <PageContainer className="space-y-6 pb-20">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <AvatarUpload
            currentUrl={profile?.avatar_url}
            userName={profile?.name}
            userEmail={user.email}
            userId={user.id}
            onUploadComplete={handleAvatarUpdate}
          />
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile?.name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile?.neighborhood && (
              <p className="text-sm text-muted-foreground">{profile.neighborhood.name}</p>
            )}
            {userBusiness && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Building2 className="h-3 w-3" />
                  Business Owner
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loop Points Section */}
        <ProfileLoopSection />
        <UserWalletQR />
        
        {/* User Pulse Settings */}
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
            <Link to={`/business/${userBusiness.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">View My Public Profile</span>
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
                <p className="text-sm text-muted-foreground">
                  Get discovered by Toledo residents
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* My Toledo Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">My Toledo</h3>
            <Link to="/my-toledo" className="text-sm text-primary">View All</Link>
          </div>
          <SavedPlacesList compact maxItems={3} />
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          {menuItems.map(item => (
            <Link key={item.href} to={item.href}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
          
          {isConnector && (
            <Link to="/connector-dashboard">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Crown className="h-5 w-5 text-amber-500" />
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

          {/* Install App option - show if not installed */}
          {!isInstalled && (canInstall || isIOS) && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <Download className="h-5 w-5 text-primary" />
              <span className="flex-1 font-medium">Install App</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* iOS Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-2xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-semibold">Install Toledo Connect</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</div>
                  <p>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</div>
                  <p>Scroll down and tap "Add to Home Screen"</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</div>
                  <p>Tap "Add" to install</p>
                </div>
              </div>
              <Button onClick={() => setShowIOSInstructions(false)} className="w-full">
                Got it
              </Button>
            </div>
          </div>
        )}

        {/* Sign out */}
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </PageContainer>
    </>
  );
}
