import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { StaffManagement } from '@/components/staff/StaffManagement';

export default function DashboardStaff() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: business, isLoading } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
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
        <Header title="Staff & Scanners" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!business) {
    navigate('/create-business');
    return null;
  }

  return (
    <>
      <Header title="Staff & Scanners" />
      
      <PageContainer className="space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="-ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        <StaffManagement businessId={business.id} />
      </PageContainer>
    </>
  );
}
