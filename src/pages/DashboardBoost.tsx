import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  Star,
  Megaphone,
  Check,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isNativeApp } from "@/lib/platform";

// Boost packages a business can browse today. Pricing labels are display-only —
// no charge is made yet (see the stubbed confirm action below). Surfacing these
// here keeps the list in one place; if boost gets a profile-level entry point,
// import BOOST_OPTIONS rather than re-listing them.
interface BoostOption {
  id: string;
  name: string;
  icon: LucideIcon;
  durationLabel: string;
  priceLabel: string;
  tagline: string;
  highlights: string[];
}

const BOOST_OPTIONS: BoostOption[] = [
  {
    id: "spotlight_24h",
    name: "Spotlight",
    icon: Star,
    durationLabel: "24 hours",
    priceLabel: "$9",
    tagline: "Pin one post to the top of your category for a day.",
    highlights: [
      "Top placement in your category feed",
      "“Boosted” label on the post",
      "Great for flash deals & one-day events",
    ],
  },
  {
    id: "trending_7d",
    name: "Trending",
    icon: TrendingUp,
    durationLabel: "7 days",
    priceLabel: "$29",
    tagline: "Stay near the top of discovery for a full week.",
    highlights: [
      "Priority placement in Discover & search",
      "Appears in the weekly “Trending Local” rotation",
      "Best for new menu items or grand openings",
    ],
  },
  {
    id: "headline_30d",
    name: "Headline",
    icon: Megaphone,
    durationLabel: "30 days",
    priceLabel: "$79",
    tagline: "Featured everywhere for a month of steady reach.",
    highlights: [
      "Homepage featured rotation",
      "Top-of-category placement",
      "Highest visibility across the app",
    ],
  },
];

export default function DashboardBoost() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BoostOption | null>(null);

  // In the native app we don't surface the priced boost catalog or the
  // (stubbed) checkout — selling/advertising digital purchases that aren't live
  // reads as unfinished, and paid digital goods must go through IAP anyway.
  const native = isNativeApp();

  if (native) {
    return (
      <>
        <Header title="Boost a Post" />
        <PageContainer className="pb-32 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>

          <div className="card-elevated p-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">Boosts are coming soon</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Soon you'll be able to get more eyes on a deal, event, or update.
              We'll let you know the moment boosts go live.
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Boost a Post" />
      <PageContainer className="pb-32 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Boost a Post</h1>
              <p className="text-sm text-muted-foreground">
                Get more eyes on a deal, event, or update. Browse boosts below —
                payments are coming soon.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {BOOST_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{option.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">
                          {option.durationLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {option.tagline}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-2">
                        {option.priceLabel}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {option.durationLabel}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 gap-1"
                      onClick={() => setSelected(option)}
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageContainer>

      {/* Boost detail + (stubbed) checkout */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <selected.icon className="h-5 w-5 text-primary" />
                  {selected.name} Boost
                </DialogTitle>
                <DialogDescription>{selected.tagline}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between rounded-xl bg-muted p-3">
                  <span className="text-sm text-muted-foreground">
                    {selected.durationLabel}
                  </span>
                  <span className="text-lg font-semibold text-primary">
                    {selected.priceLabel}
                  </span>
                </div>

                <ul className="space-y-2">
                  {selected.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground">
                  Payments aren't enabled yet — confirming won't charge you or
                  activate a boost. We'll let you know the moment it's live.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                {/* TODO: wire payment — replace this disabled stub with the real
                    checkout (e.g. supabase.functions.invoke('create-checkout', ...))
                    once boost billing is ready. Do not write to `boosts` until then. */}
                <Button
                  disabled
                  variant="secondary"
                  className="gap-1.5 cursor-default"
                  title="Payments coming soon"
                >
                  <Zap className="h-4 w-4" />
                  Coming Soon
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
