import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/admin/StatCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Send,
  Plus,
  Loader2,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FollowersManagerProps {
  businessId: string;
}

interface AnnouncementRow {
  id: string;
  business_id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  link_label: string | null;
  sent_at: string | null;
  created_at: string;
}

interface FollowerRow {
  user_id: string;
  created_at: string | null;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
}

interface AnnouncementFormState {
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
}

const EMPTY_FORM: AnnouncementFormState = {
  title: '',
  body: '',
  linkUrl: '',
  linkLabel: '',
};

function useFollowerCount(businessId: string) {
  return useQuery({
    queryKey: ['admin-follower-count', businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('business_follows')
        .select('user_id', { count: 'exact', head: true })
        .eq('business_id', businessId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId,
  });
}

function useRecentFollowers(businessId: string) {
  return useQuery({
    queryKey: ['admin-recent-followers', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_follows')
        .select('user_id, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name:name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return data.map((row) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      })) as FollowerRow[];
    },
    enabled: !!businessId,
  });
}

function useAnnouncements(businessId: string) {
  return useQuery({
    queryKey: ['admin-announcements', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AnnouncementRow[];
    },
    enabled: !!businessId,
  });
}

export function FollowersManager({ businessId }: FollowersManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: followerCount } = useFollowerCount(businessId);
  const { data: recentFollowers, isLoading } = useRecentFollowers(businessId);
  const { data: announcements } = useAnnouncements(businessId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_FORM);

  const update = <K extends keyof AnnouncementFormState>(key: K, value: AnnouncementFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('announcements').insert({
        business_id: businessId,
        title: form.title.trim(),
        body: form.body.trim() || null,
        link_url: form.linkUrl.trim() || null,
        link_label: form.linkLabel.trim() || null,
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements', businessId] });
      toast({ title: 'Announcement sent to followers' });
      setComposerOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not send', description: e.message });
    },
  });

  const sentCount = announcements?.filter((a) => a.sent_at).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Followers</h2>
          <p className="text-sm text-muted-foreground">
            Your audience and announcements.
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setComposerOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Followers"
          value={followerCount || 0}
          iconColor="text-primary"
        />
        <StatCard
          icon={Send}
          label="Announcements sent"
          value={sentCount}
          iconColor="text-emerald-600"
        />
      </div>

      {/* Announcements */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Announcements</h3>
        {!announcements?.length ? (
          <div className="card-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No announcements yet. Send updates to your followers.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="card-elevated p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{a.title}</p>
                    {a.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] shrink-0',
                      a.sent_at ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {a.sent_at ? 'Sent' : 'Draft'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(a.sent_at || a.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  {a.link_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {a.link_label || 'Link'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent followers */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Recent followers</h3>
        {!recentFollowers?.length ? (
          <div className="card-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No followers yet. As people discover your business, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentFollowers.map((f) => (
              <div key={f.user_id} className="card-elevated p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  {f.profile?.avatar_url ? (
                    <img
                      src={f.profile.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {f.profile?.display_name || 'Toledo resident'}
                  </p>
                  {f.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Followed {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer dialog */}
      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open) setComposerOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="What do your followers need to know?"
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="ann-body">Message (optional)</Label>
              <Textarea
                id="ann-body"
                value={form.body}
                onChange={(e) => update('body', e.target.value)}
                placeholder="Details, context, or a personal note"
                rows={3}
                maxLength={500}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Link URL (optional)</Label>
                <Input
                  value={form.linkUrl}
                  onChange={(e) => update('linkUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Link label</Label>
                <Input
                  value={form.linkLabel}
                  onChange={(e) => update('linkLabel', e.target.value)}
                  placeholder="Learn more"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setComposerOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.title.trim() || createMutation.isPending}
                className="gap-1.5"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send to Followers</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
