import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, Bookmark, FileText, Building2, LogOut, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Profile() {
  const { user, signOut, isAdmin, isBusiness } = useAuth();
  const navigate = useNavigate();

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

  const menuItems = [
    { icon: Bookmark, label: 'Saved', href: '/saved' },
    { icon: FileText, label: 'My Requests', href: '/my-requests' },
  ];

  return (
    <>
      <Header title="Profile" />
      
      <PageContainer className="space-y-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile?.name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile?.neighborhood && (
              <p className="text-sm text-muted-foreground">{profile.neighborhood.name}</p>
            )}
          </div>
        </div>

        {/* Business section */}
        {userBusiness ? (
          <Link to="/dashboard">
            <div className="card-elevated p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{userBusiness.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {userBusiness.status === 'approved' ? 'Active' : userBusiness.status}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
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
          
          {isAdmin && (
            <Link to="/admin">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">Admin Panel</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          )}
        </div>

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
