import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function AcceptInvitation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Fetch invitation details
  const { data: invitation, isLoading } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase
        .from('business_invitations')
        .select('*, businesses(name)')
        .eq('token', token)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (!isLoading && invitation) {
      if (invitation.accepted_at) {
        setStatus('error');
        setErrorMessage('This invitation has already been used');
      } else if (new Date(invitation.expires_at) < new Date()) {
        setStatus('error');
        setErrorMessage('This invitation has expired');
      } else {
        setStatus('loading');
      }
    } else if (!isLoading && !invitation) {
      setStatus('error');
      setErrorMessage('Invalid invitation link');
    }
  }, [invitation, isLoading]);

  const acceptInvitation = async () => {
    if (!user || !token) return;
    
    setStatus('accepting');
    
    try {
      const { data, error } = await supabase.rpc('accept_business_invitation', {
        invitation_token: token,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; business_id?: string };
      
      if (result.success) {
        setStatus('success');
        setBusinessId(result.business_id || null);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to accept invitation');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Invalid Link</h1>
        <p className="text-muted-foreground mb-6">This invitation link is invalid</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Invitation Error</h1>
        <p className="text-muted-foreground mb-6 text-center">{errorMessage}</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">You're In!</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You've been added as staff for {(invitation?.businesses as any)?.name}
        </p>
        <Button size="lg" onClick={() => navigate(`/scanner-mode?business=${businessId}`)}>
          Open Scanner Mode
        </Button>
      </div>
    );
  }

  // Show invitation details and accept button
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Staff Invitation</h1>
        <p className="text-muted-foreground mb-2 text-center">
          You've been invited to join
        </p>
        <p className="text-xl font-semibold mb-6">
          {(invitation?.businesses as any)?.name}
        </p>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Sign in or create an account to accept this invitation
        </p>
        <Button size="lg" onClick={() => navigate(`/auth?redirect=/accept-invitation?token=${token}`)}>
          Sign In to Accept
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Building2 className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Staff Invitation</h1>
      <p className="text-muted-foreground mb-2 text-center">
        You've been invited to join
      </p>
      <p className="text-xl font-semibold mb-2">
        {(invitation?.businesses as any)?.name}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Role: <span className="capitalize">{invitation?.role}</span>
      </p>
      
      <Button 
        size="lg" 
        onClick={acceptInvitation}
        disabled={status === 'accepting'}
      >
        {status === 'accepting' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Accepting...
          </>
        ) : (
          'Accept Invitation'
        )}
      </Button>
    </div>
  );
}
