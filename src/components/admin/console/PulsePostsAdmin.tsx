import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Radio, Trash2, Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAdminPulsePosts, useDeletePulsePost } from '@/hooks/useAdminPulsePosts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Admin surface to delete any Pulse post (not just reported ones). Sits next to
// the report queue under the Moderation tab.
export function PulsePostsAdmin() {
  const { can } = usePermissions();
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const { data: posts, isLoading } = useAdminPulsePosts(filter);
  const del = useDeletePulsePost();

  if (!can('moderate')) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" /> You don't have moderation access.
      </div>
    );
  }

  const handleDelete = async (postId: string) => {
    try {
      await del.mutateAsync(postId);
      toast.success('Pulse post deleted');
    } catch {
      toast.error('Delete failed. Check your permissions.');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">All Pulse posts</h3>
      </div>

      <div className="flex gap-1.5">
        {(['active', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground shadow-sm">
          No {filter === 'all' ? '' : 'active '}Pulse posts right now.
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  {p.headline ? <span className="font-medium">{p.headline} · </span> : null}
                  {p.content ? `"${p.content}"` : <span className="text-muted-foreground">No text</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.business?.name ? `${p.business.name} · ` : ''}
                  {p.author_type || 'user'}
                  {p.content_type ? ` · ${p.content_type.replace(/_/g, ' ')}` : ''}
                  {p.neighborhood ? ` · ${p.neighborhood}` : ''}
                  {p.status !== 'active' ? ` · ${p.status}` : ''}
                  {' · '}
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 rounded-full text-xs text-destructive hover:text-destructive"
                onClick={() => setPendingDelete(p.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Pulse post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the post and its reactions. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={del.isPending}
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
