import { Briefcase } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { JobCard } from '@/components/cards/JobCard';
import { LogoLoader } from '@/components/ui/logo-loader';

// Beta-only job posts surfaced inside the Founding Beta Circle. The query is the
// normal approved-jobs feed; RLS returns beta posts only to active members, so
// filtering to visibility === 'beta' here shows the cohort-only openings.
export function BetaJobs() {
  const { data: jobs, isLoading } = useJobs();
  const betaJobs = (jobs ?? []).filter((j) => j.visibility === 'beta');

  if (isLoading) {
    return <div className="flex justify-center py-10"><LogoLoader size="md" /></div>;
  }

  if (betaJobs.length === 0) {
    return (
      <div className="py-10 text-center">
        <Briefcase className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No beta job posts yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {betaJobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
