import { useState } from 'react';
import { Heart, Filter, Award, MapPin } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NonprofitCard } from '@/components/community/NonprofitCard';
import { useNonprofits, CAUSE_CATEGORY_LABELS } from '@/hooks/useNonprofits';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { Database } from '@/integrations/supabase/types';

type CauseCategory = Database['public']['Enums']['cause_category'];

const CAUSE_CATEGORIES = Object.keys(CAUSE_CATEGORY_LABELS) as CauseCategory[];

export default function Community() {
  const [selectedCause, setSelectedCause] = useState<CauseCategory | 'all'>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');

  const { data: neighborhoods } = useNeighborhoods();
  const { data: nonprofits, isLoading } = useNonprofits({
    causeCategory: selectedCause === 'all' ? undefined : selectedCause,
    neighborhoodId: selectedNeighborhood === 'all' ? undefined : selectedNeighborhood,
  });

  const foundingPartners = nonprofits?.filter(n => n.founding_community_partner) || [];
  const otherNonprofits = nonprofits?.filter(n => !n.founding_community_partner) || [];

  return (
    <>
      <SEOHead
        title="Community | ToledoLokal"
        description="Discover local nonprofits and community organizations in Toledo. Find causes you care about and learn how to get involved."
        url="/community"
      />
      <Header title="Community" showBack />
      
      <PageContainer className="pb-24">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium text-rose-500">Give Back</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Local Causes & Organizations
          </h1>
          <p className="text-muted-foreground">
            Explore nonprofits making a difference in Toledo
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select
            value={selectedCause}
            onValueChange={(value) => setSelectedCause(value as CauseCategory | 'all')}
          >
            <SelectTrigger className="flex-1 rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Causes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Causes</SelectItem>
              {CAUSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {CAUSE_CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedNeighborhood}
            onValueChange={setSelectedNeighborhood}
          >
            <SelectTrigger className="flex-1 rounded-xl">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {neighborhoods?.map((hood) => (
                <SelectItem key={hood.id} value={hood.id}>
                  {hood.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : nonprofits?.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* Founding Partners Section */}
            {foundingPartners.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Founding Community Partners
                  </h2>
                </div>
                <div className="grid gap-4">
                  {foundingPartners.map((nonprofit) => (
                    <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Nonprofits */}
            {otherNonprofits.length > 0 && (
              <section>
                {foundingPartners.length > 0 && (
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Community Organizations
                  </h2>
                )}
                <div className="grid gap-4">
                  {otherNonprofits.map((nonprofit) => (
                    <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
        <Heart className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No community updates yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
        This space grows as people show up. Check back soon or adjust your filters.
      </p>
    </div>
  );
}
