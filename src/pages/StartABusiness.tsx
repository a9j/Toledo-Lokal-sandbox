import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStartABusiness } from '@/hooks/useEconomy';

const STORAGE_KEY = 'start-a-business-done';

/**
 * Start a Business: ten steps in the order they actually happen.
 *
 * Ticks are kept in this browser only. Nothing about someone's plans to start a
 * business needs to be on a server, and keeping it local means a half finished
 * checklist is not a record anyone else can read.
 */
export default function StartABusiness() {
  const { data, isLoading, error } = useStartABusiness();
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as string[]);
    } catch {
      // A blocked or full localStorage is not worth an error message here.
    }
  }, []);

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ticks just will not survive a reload. The list still works.
      }
      return next;
    });
  };

  return (
    <>
      <SEOHead
        title="Start a business | ToledoLokal"
        description="Ten steps to opening a business in Toledo, in the order they happen."
      />
      <Header title="Start a business" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Start a business</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${done.length} of ${data.steps.length} done.` : 'Ten steps, in order.'} Ticks
            stay on this device.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            Could not load the checklist. Check your connection and try again.
          </p>
        ) : (
          <ol className="space-y-3">
            {data?.steps.map((step, i) => {
              const isDone = done.includes(step.key);
              return (
                <li key={step.key}>
                  <div
                    className={
                      'rounded-xl border p-4 transition-colors ' +
                      (isDone ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card')
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggle(step.key)}
                      className="flex w-full items-start gap-3 text-left"
                      aria-pressed={isDone}
                    >
                      <span className="mt-0.5 shrink-0">
                        {isDone ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {i + 1}
                          </span>
                          <span
                            className={
                              'text-sm font-semibold leading-snug ' +
                              (isDone ? 'text-muted-foreground line-through' : '')
                            }
                          >
                            {step.title}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                          {step.body}
                        </span>
                      </span>
                    </button>

                    {/* Steps that map onto a local business category link
                        straight into search, so the answer is a Toledo
                        accountant rather than a web result. */}
                    {step.category && (
                      <Link
                        to={`/ask?q=${encodeURIComponent(
                          `local ${step.category.replace(/_/g, ' ')} who works with new businesses`,
                        )}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                      >
                        <Search className="h-3 w-3" />
                        Find someone local for this
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {data?.note && (
          <p className="mt-6 text-xs leading-snug text-muted-foreground">{data.note}</p>
        )}
      </PageContainer>
    </>
  );
}
