import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Crown, Shield, Building2, Heart, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function UsersAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_profiles');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ['admin-all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: connectors } = useQuery({
    queryKey: ['admin-connectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('user_id, is_founding, referral_code');
      if (error) throw error;
      return data || [];
    },
  });

  const makeConnector = useMutation({
    mutationFn: async (userId: string) => {
      // Create connector record
      const { error: connError } = await supabase
        .from('connectors')
        .insert({ user_id: userId, is_founding: true });
      if (connError) throw connError;

      // Add connector role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'connector' });
      if (roleError && !roleError.message.includes('duplicate')) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-connectors'] });
      toast({ title: '✨ Founding Connector assigned!' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    },
  });

  const removeConnector = useMutation({
    mutationFn: async (userId: string) => {
      const { error: connError } = await supabase
        .from('connectors')
        .delete()
        .eq('user_id', userId);
      if (connError) throw connError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'connector');
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-connectors'] });
      toast({ title: 'Connector status removed' });
    },
  });

  const getRolesForUser = (userId: string) => {
    return allRoles?.filter(r => r.user_id === userId).map(r => r.role) || [];
  };

  const isConnectorUser = (userId: string) => {
    return connectors?.some(c => c.user_id === userId) || false;
  };

  const getConnectorCode = (userId: string) => {
    return connectors?.find(c => c.user_id === userId)?.referral_code;
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'business': return <Building2 className="h-3 w-3" />;
      case 'connector': return <Crown className="h-3 w-3" />;
      case 'nonprofit': return <Heart className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'business': return 'bg-primary/10 text-primary border-primary/20';
      case 'connector': return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0';
      case 'nonprofit': return 'bg-green-100 text-green-700 border-green-200';
      default: return '';
    }
  };

  const filtered = profiles?.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (p as any).name?.toLowerCase().includes(term) || 
           (p as any).user_id?.toLowerCase().includes(term);
  }) || [];

  const sortedProfiles = [...filtered].sort((a: any, b: any) => {
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {profiles?.length || 0} registered users
        </p>
        <Badge variant="outline" className="gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <Crown className="h-3 w-3 text-amber-600" />
          <span className="text-amber-700">
            {connectors?.length || 0} Connectors
          </span>
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading users...</p>
      ) : (
        <div className="space-y-2">
          {sortedProfiles.map((profile: any) => {
            const roles = getRolesForUser(profile.user_id);
            const isConn = isConnectorUser(profile.user_id);
            const code = getConnectorCode(profile.user_id);

            return (
              <div 
                key={profile.id} 
                className={`card-elevated p-3 ${isConn ? 'ring-1 ring-amber-400/40' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{profile.name || 'Unnamed'}</span>
                      {roles.filter(r => r !== 'resident').map(role => (
                        <Badge 
                          key={role} 
                          variant="outline"
                          className={`text-[10px] gap-1 ${roleColor(role)}`}
                        >
                          {roleIcon(role)}
                          {role}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                      {code && (
                        <span className="text-amber-600 font-mono">{code}</span>
                      )}
                    </div>
                  </div>
                  
                  {isConn ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                      onClick={() => removeConnector.mutate(profile.user_id)}
                      disabled={removeConnector.isPending}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => makeConnector.mutate(profile.user_id)}
                      disabled={makeConnector.isPending}
                    >
                      <Crown className="h-3 w-3" />
                      Make Connector
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
