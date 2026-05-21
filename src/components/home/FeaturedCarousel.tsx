import { Link } from 'react-router-dom';
import { ChevronRight, Heart, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedCarouselProps {
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  businesses: any[] | undefined;
  isLoading: boolean;
}

/**
 * Horizontal-scroll spotlight carousel matching the "Featured in Toledo" mockup.
 * Each card: 16:11 image, top-left type pill, top-right heart, title, sub, neighborhood.
 */
export function FeaturedCarousel({
  title = 'Featured in Toledo',
  subtitle = 'Handpicked favorites',
  viewAllLink = '/explore',
  businesses,
  isLoading,
}: FeaturedCarouselProps) {
  return (
    <section className="py-6">
      <div className="flex items-end justify-between mb-3 px-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
          >
            {subtitle}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <Skeleton key={i} className="shrink-0 w-[260px] h-[280px] rounded-2xl" />
            ))
          : businesses?.length
          ? businesses.map((biz) => (
              <FeaturedCard key={biz.id} business={biz} />
            ))
          : (
            <div className="w-full text-center text-muted-foreground text-sm py-6">
              No featured listings yet
            </div>
          )}
      </div>
    </section>
  );
}

function FeaturedCard({ business }: { business: any }) {
  const type =
    business.business_type === 'nonprofit'
      ? 'NONPROFIT'
      : business.business_type === 'event'
      ? 'EVENT'
      : 'BUSINESS';

  const imageUrl =
    business.cover_image_url ||
    business.logo_url ||
    business.image_url ||
    `https://source.unsplash.com/600x400/?toledo,${type.toLowerCase()}`;

  return (
    <Link
      to={`/business/${business.slug || business.id}`}
      className="shrink-0 w-[260px] snap-start rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/40 transition-all"
    >
      <div className="relative aspect-[16/11] bg-muted overflow-hidden">
        <img
          src={imageUrl}
          alt={business.name || 'Featured listing'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
          {type}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
          }}
          aria-label="Save"
          className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white/90 hover:text-primary transition-colors"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-[15px] font-bold text-foreground leading-tight line-clamp-2">
          {business.name}
        </h3>
        {business.tagline && (
          <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">
            {business.tagline}
          </p>
        )}
        {business.neighborhood && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {business.neighborhood}
          </div>
        )}
      </div>
    </Link>
  );
}
