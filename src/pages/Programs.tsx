import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Programs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*, category:categories(name)')
        .in('status', ['open', 'coming_soon'])
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: userSignups } = useQuery({
    queryKey: ['program-signups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('program_signups')
        .select('program_id, status')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const signupMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase.from('program_signups').insert({
        program_id: programId,
        user_id: user.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-signups'] });
      toast({ title: 'Successfully enrolled!' });
    },
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to enroll. Please try again.' 
      });
    },
  });

  const isEnrolled = (programId: string) => 
    userSignups?.some(s => s.program_id === programId);

  return (
    <>
      <SEOHead 
        title="Community Programs"
        description="Discover city initiatives and community programs for Toledo residents. Find opportunities, resources, and support in the Glass City."
        url="/programs"
        keywords={['Toledo programs', 'Toledo community', 'Toledo resources', 'city initiatives Toledo', 'Glass City programs']}
      />
      <Header title="Programs" />
      
      <PageContainer className="space-y-4">
        <p className="text-sm text-muted-foreground">
          City initiatives, community programs, and opportunities for Toledo residents.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : programs?.length ? (
          <div className="space-y-4">
            {programs.map(program => (
              <div key={program.id} className="card-elevated overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {program.featured && (
                          <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px]">
                            Featured
                          </Badge>
                        )}
                        {program.status === 'coming_soon' && (
                          <Badge variant="secondary" className="text-[10px]">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold">{program.title}</h3>
                      {program.category && (
                        <p className="text-sm text-muted-foreground">{program.category.name}</p>
                      )}
                    </div>
                  </div>

                  {program.overview && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {program.overview}
                    </p>
                  )}

                  {program.eligibility && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Eligibility</p>
                      <p className="text-sm">{program.eligibility}</p>
                    </div>
                  )}

                  {program.benefits && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Benefits</p>
                      <p className="text-sm">{program.benefits}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isEnrolled(program.id) ? (
                      <Button disabled className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Enrolled
                      </Button>
                    ) : program.status === 'coming_soon' ? (
                      <Button disabled variant="outline" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Coming Soon
                      </Button>
                    ) : user ? (
                      <Button 
                        onClick={() => signupMutation.mutate(program.id)}
                        disabled={signupMutation.isPending}
                      >
                        {signupMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
                    ) : (
                      <Link to="/auth">
                        <Button>Sign in to Enroll</Button>
                      </Link>
                    )}

                    {program.signup_url && (
                      <Button variant="outline" asChild className="gap-2">
                        <a href={program.signup_url} target="_blank" rel="noopener noreferrer">
                          Learn More
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No programs available yet</p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
