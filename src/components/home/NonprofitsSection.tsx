import { Link } from 'react-router-dom';
import { ChevronRight, HeartHandshake, Handshake } from 'lucide-react';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';

export function NonprofitsSection() {
  const { data: categories } = useCategories();
  const volunteerCategory = categories?.find(c => c.name === 'Volunteer & Nonprofit');
  
  const { data: nonprofits, isLoading } = useBusinesses({ 
    categoryId: volunteerCategory?.id,
    limit: 4 
  });

  return (
    <section className="px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <HeartHandshake className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">Give Back</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Volunteer & Nonprofits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Make a difference in Toledo
          </p>
        </div>
        <Link 
          to="/explore?category=Volunteer+%26+Nonprofit" 
          className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline pt-1"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Featured Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 mb-4 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-1.5"><Handshake className="h-5 w-5" /> Join the Movement</h3>
          <p className="text-white/80 text-sm">
            Volunteer your time, donate supplies, or support local causes. Every little bit helps!
          </p>
        </div>
      </div>

      {/* Nonprofits Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : nonprofits?.length ? (
        <div className="grid grid-cols-2 gap-3">
          {nonprofits.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center">
          <HeartHandshake className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No nonprofits listed yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Know a local nonprofit? Help them get listed!
          </p>
        </div>
      )}
    </section>
  );
}
