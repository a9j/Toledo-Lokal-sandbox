import { useParams, Link } from 'react-router-dom';
import { usePublicCollection } from '@/hooks/useMyToledo';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SecureImage } from '@/components/ui/secure-image';
import { SEOHead } from '@/components/seo/SEOHead';
import { Heart, MapPin, Building2, ArrowRight } from 'lucide-react';

export default function PublicCollection() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = usePublicCollection(slug);

  if (isLoading) {
    return (
      <>
        <Header title="Collection" showBack />
        <PageContainer className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header title="Collection" showBack />
        <PageContainer>
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Collection not found or is private</p>
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const { settings, items } = data;

  return (
    <>
      <SEOHead
        title={`${settings.collection_name} | ToledoLokal`}
        description={`A curated collection of ${items.length} favorite Toledo spots`}
        url={`/c/${slug}`}
      />
      <Header title={settings.collection_name ?? undefined} showBack />
      
      <PageContainer className="space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {settings.collection_name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} {items.length === 1 ? 'place' : 'places'}
          </p>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => {
            if (item.item_type !== 'business' || !item.business) return null;
            const business = item.business;

            return (
              <Link
                key={item.id}
                to={`/business/${business.id}`}
                className="card-elevated p-4 flex gap-4 hover:bg-muted/30 transition-colors"
              >
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {business.logo_url ? (
                    <SecureImage
                      storagePath={business.logo_url}
                      alt={business.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {business.name}
                  </h3>
                  
                  {business.category && (
                    <p className="text-sm text-muted-foreground">
                      {business.category.name}
                    </p>
                  )}

                  {business.neighborhood && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {business.neighborhood.name}
                    </div>
                  )}

                  {item.note && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      "{item.note}"
                    </p>
                  )}
                </div>

                <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 self-center" />
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            Create your own Toledo collection
          </p>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </PageContainer>
    </>
  );
}
