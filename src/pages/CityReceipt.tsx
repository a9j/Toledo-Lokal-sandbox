import { Link } from 'react-router-dom';
import { Receipt, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyHome, useCityBudgetSplit } from '@/hooks/useMyCity';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

/**
 * City Receipt.
 *
 * One year of property tax, split by the published budget percentages. The
 * split lives in app_settings so it can be corrected without a deploy.
 */
export default function CityReceipt() {
  const { data: home, isLoading: homeLoading } = useMyHome();
  const { data: budget, isLoading: budgetLoading } = useCityBudgetSplit();

  const loading = homeLoading || budgetLoading;
  const total = home?.tax_year_amount ?? null;
  const shares = budget?.shares ?? [];
  const percentSum = shares.reduce((sum, share) => sum + (share.percent ?? 0), 0);

  return (
    <>
      <Header title="City Receipt" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">City Receipt</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Where a year of your property tax goes.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !home ? (
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Set your address first</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              The receipt is built from your parcel's tax record.
            </p>
            <Button asChild className="mt-5">
              <Link to="/my-city">Go to My City</Link>
            </Button>
          </div>
        ) : total == null ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            We do not have a tax amount on file for {home.address} yet.
          </p>
        ) : (
          <>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                One year, {home.address}
              </p>
              <p className="mt-1 font-heading text-3xl font-semibold tracking-tight">
                {money(Number(total))}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {shares.map((share) => {
                const amount = (Number(total) * (share.percent ?? 0)) / 100;
                return (
                  <div key={share.label} className="rounded-xl border border-border/60 bg-card p-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{share.label}</span>
                      <span className="text-sm font-semibold">{money(amount)}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(share.percent ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{share.percent}% of the bill</p>
                  </div>
                );
              })}
            </div>

            {/* Never let a placeholder split read as the real city budget. */}
            {(budget?.source === 'placeholder' || home.source === 'seed') && (
              <div className="mt-5 flex gap-3 rounded-xl border border-border/60 bg-muted/50 p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-xs leading-snug text-muted-foreground">
                  <p className="font-medium text-foreground">This is an estimate, not a bill.</p>
                  <p className="mt-1">
                    {home.source === 'seed' && 'The tax amount is placeholder test data. '}
                    {budget?.source === 'placeholder' &&
                      'The percentages are placeholders until the published City of Toledo budget is loaded. '}
                    Do not use this to work out what you owe.
                  </p>
                </div>
              </div>
            )}

            {percentSum !== 100 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Note: the shares add up to {percentSum}%, not 100%. The split needs correcting
                in settings.
              </p>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
