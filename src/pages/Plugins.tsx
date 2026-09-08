import { Link } from 'react-router-dom';
import { Blocks, ExternalLink, ArrowRight, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePlugins, type PluginAction, type PluginRow } from '@/hooks/usePlatform';

/**
 * An action is rendered only if its target still looks right at render time.
 *
 * The database validates every manifest on the way in, and this checks again on
 * the way out. Two checks for the same thing is deliberate: a manifest is third
 * party content, the validator is one migration away from being loosened by
 * accident, and the cost of the second check is four lines.
 */
function safeTarget(action: PluginAction): { href?: string; to?: string } | null {
  const target = action.target ?? '';
  if (action.kind === 'deep_link') {
    return /^https?:\/\//i.test(target) ? { href: target } : null;
  }
  if (action.kind === 'internal_route') {
    return /^\/[A-Za-z0-9_][A-Za-z0-9/_:.-]*$/.test(target) ? { to: target } : null;
  }
  // 'rpc' actions have no link. Ask Toledo will call them once the tool binding
  // exists; until then there is nothing for a person to press.
  return null;
}

function ActionButton({ action }: { action: PluginAction }) {
  const safe = safeTarget(action);
  if (!safe) return null;

  if (safe.href) {
    return (
      <Button asChild size="sm" variant="outline">
        <a href={safe.href} target="_blank" rel="noopener noreferrer">
          {action.title}
          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
        </a>
      </Button>
    );
  }
  return (
    <Button asChild size="sm" variant="outline">
      <Link to={safe.to as string}>
        {action.title}
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}

function PluginCard({ plugin }: { plugin: PluginRow }) {
  const actions = plugin.manifest?.actions ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{plugin.name}</p>
        {plugin.org_name && (
          <Badge variant="secondary" className="text-[10px]">
            {plugin.org_name}
          </Badge>
        )}
      </div>
      {plugin.summary && (
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{plugin.summary}</p>
      )}

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <ActionButton key={action.key} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The plugin directory.
 *
 * A plugin declares screens and actions in a manifest. Ask Toledo will read
 * those actions as tools, which is not wired yet: the two model calls have
 * never run in this environment, and giving an unexercised model a set of
 * callable actions would stack one untested thing on another.
 */
export default function Plugins() {
  const { data: plugins, isLoading, error } = usePlugins();

  return (
    <>
      <SEOHead
        title="Plugins | ToledoLokal"
        description="Things other organisations have plugged into Toledo Lokal."
      />
      <Header title="Plugins" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Plugins</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Things other organisations have plugged in. Each one declares what it can do.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Could not load the plugins. Check your connection and try again.
            </p>
          </div>
        ) : !plugins || plugins.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Blocks className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Nothing plugged in yet</h2>
          </div>
        ) : (
          <div className="space-y-3">
            {plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        )}

        <p className="mt-6 text-xs leading-snug text-muted-foreground">
          Ask Toledo will be able to use these actions directly. That is not wired yet, and it
          waits until the assistant has answered one real question in an environment that can
          reach the model.
        </p>
      </PageContainer>
    </>
  );
}
