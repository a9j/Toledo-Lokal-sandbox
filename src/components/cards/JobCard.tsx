import { Link } from 'react-router-dom';
import { Briefcase, DollarSign, Clock, Zap, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Job, JobType } from '@/hooks/useJobs';
import { SecureImage } from '@/components/ui/secure-image';

interface JobCardProps {
  job: Job;
  showLocalEmployerBadge?: boolean;
}

const jobTypeLabels: Record<JobType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'seasonal': 'Seasonal',
  'entry-level': 'Entry-level',
  'skilled-trades': 'Skilled Trade',
  'internship': 'Internship',
  'gig': 'Gig',
};

const formatPay = (job: Job): string => {
  if (!job.pay_min && !job.pay_max) return '';
  
  const formatAmount = (amount: number) => {
    if (job.pay_type === 'salary') {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${amount}`;
  };

  if (job.pay_min && job.pay_max) {
    return `${formatAmount(job.pay_min)} - ${formatAmount(job.pay_max)}${job.pay_type === 'hourly' ? '/hr' : ''}`;
  }
  if (job.pay_min) {
    return `${formatAmount(job.pay_min)}+${job.pay_type === 'hourly' ? '/hr' : ''}`;
  }
  if (job.pay_max) {
    return `Up to ${formatAmount(job.pay_max)}${job.pay_type === 'hourly' ? '/hr' : ''}`;
  }
  return '';
};

export function JobCard({ job, showLocalEmployerBadge = false }: JobCardProps) {
  const pay = formatPay(job);

  return (
    <Link to={job.business ? `/business/${job.business.id}` : '#'} className="block group">
      <div className="card-elevated p-4 hover:bg-secondary/30 transition-colors">
        <div className="flex gap-4">
          {/* Business Logo */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
            {job.business?.logo_url ? (
              <SecureImage
                storagePath={job.business.logo_url}
                alt={job.business.name}
                className="w-full h-full"
                imgClassName="object-cover"
                fallback={<Briefcase className="h-5 w-5 text-primary" />}
              />
            ) : (
              <Briefcase className="h-5 w-5 text-primary" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                {job.business && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {job.business.name}
                      {job.business.neighborhood && ` · ${job.business.neighborhood.name}`}
                    </p>
                    {showLocalEmployerBadge && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] px-1 py-0">
                        <Crown className="h-2 w-2 mr-0.5" />
                        Local
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {job.hiring_now && (
                  <Badge variant="secondary" className="bg-success/10 text-success text-[10px] px-1.5">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Hiring Now
                  </Badge>
                )}
                {job.featured && (
                  <span className="text-[10px] font-semibold text-toledo-gold uppercase tracking-wide">
                    Featured
                  </span>
                )}
              </div>
            </div>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] font-normal">
                {jobTypeLabels[job.job_type]}
              </Badge>
              
              {pay && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{pay}</span>
                </div>
              )}
              
              {job.schedule && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{job.schedule}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
