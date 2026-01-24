import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  ExternalLink,
  ArrowLeft,
  Quote
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureImage } from '@/components/ui/secure-image';
import { FoundingPartnerBadge } from '@/components/community/FoundingPartnerBadge';
import { CommunitySupportDisplay } from '@/components/community/CommunitySupportDisplay';
import { useNonprofit, CAUSE_CATEGORY_LABELS } from '@/hooks/useNonprofits';
import { useAuth } from '@/contexts/AuthContext';

export default function NonprofitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: nonprofit, isLoading, error } = useNonprofit(slug);

  if (isLoading) {
    return (
      <>
        <Header showBack />
        <PageContainer>
          <Skeleton className="h-48 w-full rounded-2xl mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (error || !nonprofit) {
    return (
      <>
        <Header showBack />
        <PageContainer>
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Organization not found</h2>
            <p className="text-muted-foreground mb-6">
              This nonprofit may have been removed or the link is incorrect.
            </p>
            <Link to="/community">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const canEdit = user && nonprofit.claimed_by === user.id;

  return (
    <>
      <SEOHead
        title={`${nonprofit.name} | ToledoLokal Community`}
        description={nonprofit.mission_statement}
        url={`/community/${nonprofit.slug || nonprofit.id}`}
      />
      <Header showBack />
      
      <PageContainer className="pb-24">
        {/* Cover Image */}
        <div className="relative -mx-4 h-48 bg-gradient-to-br from-rose-100 to-rose-50 mb-6">
          {nonprofit.cover_image_url ? (
            <SecureImage
              storagePath={nonprofit.cover_image_url}
              alt={nonprofit.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="h-16 w-16 text-rose-200" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Logo + Header */}
        <div className="relative -mt-12 mb-6">
          {nonprofit.logo_url && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-card border-4 border-background shadow-lg mb-4">
              <SecureImage
                storagePath={nonprofit.logo_url}
                alt={nonprofit.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {nonprofit.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-200">
                  {CAUSE_CATEGORY_LABELS[nonprofit.cause_category]}
                </Badge>
                {nonprofit.neighborhood && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {nonprofit.neighborhood.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Founding Partner Badge */}
        {nonprofit.founding_community_partner && (
          <div className="mb-6">
            <FoundingPartnerBadge variant="profile" />
          </div>
        )}

        {/* Mission Statement */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Mission
          </h2>
          <p className="text-foreground leading-relaxed">
            {nonprofit.mission_statement}
          </p>
        </section>

        {/* What This Helps */}
        {nonprofit.what_this_helps && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              What This Helps
            </h2>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-foreground">{nonprofit.what_this_helps}</p>
            </div>
          </section>
        )}

        {/* How Community Shows Up */}
        <section className="mb-6">
          <CommunitySupportDisplay supportTypes={nonprofit.community_support_types} />
        </section>

        {/* Human Note */}
        {nonprofit.human_note && (
          <section className="mb-6">
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
              <Quote className="absolute top-3 left-3 h-5 w-5 text-amber-300" />
              <p className="text-sm text-amber-900 italic pl-6">
                "{nonprofit.human_note}"
              </p>
            </div>
          </section>
        )}

        {/* Contact Info */}
        <section className="space-y-2">
          {nonprofit.website && (
            <a
              href={nonprofit.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground truncate">
                {nonprofit.website.replace(/^https?:\/\//, '')}
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
          
          {nonprofit.email && (
            <a
              href={`mailto:${nonprofit.email}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{nonprofit.email}</span>
            </a>
          )}
          
          {nonprofit.phone && (
            <a
              href={`tel:${nonprofit.phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{nonprofit.phone}</span>
            </a>
          )}
          
          {nonprofit.address && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{nonprofit.address}</span>
            </div>
          )}
        </section>
      </PageContainer>
    </>
  );
}
