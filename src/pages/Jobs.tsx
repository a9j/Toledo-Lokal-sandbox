import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useJobs, JobType, Job } from '@/hooks/useJobs';
import { JobCard } from '@/components/cards/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Briefcase, Zap, Filter, X } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { JobsNearMe } from '@/components/city-os/JobsNearMe';
import { isLoopParticipant } from '@/lib/loop-tiers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const jobTypes: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'entry-level', label: 'Entry-level' },
  { value: 'skilled-trades', label: 'Skilled Trades' },
  { value: 'internship', label: 'Internship' },
  { value: 'gig', label: 'Gig' },
];

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<JobType | undefined>();
  const [hiringNowOnly, setHiringNowOnly] = useState(false);
  const [payMin, setPayMin] = useState<number | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  // Phase 6 adds a second view rather than replacing the shipped one. Near me
  // sorts by distance from home and carries the ten filters that decide whether
  // someone can actually take a job: a car, a record, a shift that fits school.
  const [view, setView] = useState<'all' | 'near'>('all');

  const { data: jobs, isLoading } = useJobs({
    jobType: selectedType,
    hiringNow: hiringNowOnly || undefined,
    payMin,
  });

  // Filter by search query (client-side for now)
  const filteredJobs = jobs?.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.business?.name?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query)
    );
  });

  const activeFiltersCount = [selectedType, hiringNowOnly, payMin].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedType(undefined);
    setHiringNowOnly(false);
    setPayMin(undefined);
    setFilterOpen(false);
  };

  return (
    <>
      <SEOHead 
        title="Local Jobs & Gigs | ToledoLokal"
        description="Find local jobs and gig opportunities from Toledo businesses. No recruiters, no spam - just real local opportunities."
      />
      <Header title="Jobs & Gigs" />
      
      <PageContainer className="space-y-4">
        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Local Jobs & Gigs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real opportunities from Toledo businesses
          </p>
        </div>

        <div className="flex gap-2">
          {(['all', 'near'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={
                'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ' +
                (view === v
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-card hover:bg-muted/40')
              }
            >
              {v === 'all' ? 'All jobs' : 'Near me'}
            </button>
          ))}
        </div>

        {view === 'near' && <JobsNearMe />}

        {view === 'all' && (
        <>
        {/* Search & Filter Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative flex-shrink-0">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Job Type */}
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select 
                    value={selectedType || ''} 
                    onValueChange={(v) => setSelectedType(v as JobType || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {jobTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hiring Now */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiring Now Only</Label>
                    <p className="text-xs text-muted-foreground">Show urgent openings</p>
                  </div>
                  <Switch 
                    checked={hiringNowOnly} 
                    onCheckedChange={setHiringNowOnly}
                  />
                </div>

                {/* Min Pay */}
                <div className="space-y-2">
                  <Label>Minimum Pay ($/hr)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 15"
                    value={payMin || ''}
                    onChange={(e) => setPayMin(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Badge 
            variant={hiringNowOnly ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setHiringNowOnly(!hiringNowOnly)}
          >
            <Zap className="h-3 w-3 mr-1" />
            Hiring Now
          </Badge>
          {jobTypes.slice(0, 4).map(type => (
            <Badge 
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedType(selectedType === type.value ? undefined : type.value)}
            >
              {type.label}
            </Badge>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-elevated p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredJobs && filteredJobs.length > 0 ? (
            filteredJobs.map(job => {
              // Check if business is a Loop participant (paid tier)
              const loopSettings = job.business?.business_loop_settings;
              const isPaidTier = loopSettings?.is_active && isLoopParticipant(loopSettings.loop_tier_id);
              
              return (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  showLocalEmployerBadge={isPaidTier}
                />
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">No jobs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || activeFiltersCount > 0 
                  ? 'Try adjusting your filters'
                  : 'Check back soon for new opportunities'
                }
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </PageContainer>
    </>
  );
}
