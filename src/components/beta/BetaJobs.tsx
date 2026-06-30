import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/cards/JobCard';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export function BetaJobs() {
  const { data: jobs, isLoading } = useJobs();
  const betaJobs = (jobs ?? []).filter((j) => j.visibility === 'beta');

  if (isLoading) {
    return <div className="flex justify-center py-10"><LogoLoader size="md" /></div>;
  }

  if (betaJobs.length > 0) {
    return (
      <div className="space-y-3">
        {betaJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    );
  }

  return <BetaJobsFallback />;
}

function BetaJobsFallback() {
  const { data, isLoading } = useQuery({
    queryKey: ['beta-jobs-fallback'],
    queryFn: async () => {
      const { data: recentJobs, error } = await supabase
        .from('jobs')
        .select('id, title, businesses!inner(name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return recentJobs ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.05] to-transparent p-5 text-center">
        <Briefcase className="mx-auto mb-2 h-6 w-6 text-primary" strokeWidth={1.8} />
        <p className="text-sm font-semibold text-foreground">
          Beta-only job posts will appear here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          In the meantime, check out who's hiring locally.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Local Jobs</h3>
            <Link to="/jobs" className="text-xs text-primary flex items-center gap-0.5">
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data!.map((j: { id: string; title: string; businesses: { name: string } }) => (
              <div
                key={j.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
              >
                <Briefcase className="h-4 w-4 text-primary shrink-0" strokeWidth={1.8} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{j.title}</p>
                  <p className="text-[11px] text-muted-foreground">{j.businesses?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
