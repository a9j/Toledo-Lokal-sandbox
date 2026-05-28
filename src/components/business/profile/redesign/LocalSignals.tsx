import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Sparkles, Award, Heart, MessageSquarePlus, Check, X, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  reactionOptionsFor, reactionLabel, knownForTrait, loveSentence, badgeForReaction,
  BADGE_THRESHOLD, RECOMMENDATION_PROMPTS,
} from '@/lib/local-signals';
import { ProfileBusiness } from './profile-types';
import { ProfileCard, SectionLabel, EmptyState } from './ProfilePrimitives';

export function LocalSignals({ business }: { business: ProfileBusiness }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const businessId = business.id;
  const [composing, setComposing] = useState(false);
  const [momentText, setMomentText] = useState('');

  const { data: reactions } = useQuery({
    queryKey: ['ls-reactions', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('local_reactions').select('reaction_type, user_id').eq('business_id', businessId);
      if (error) throw error;
      return data;
    },
  });
  const { data: moments } = useQuery({
    queryKey: ['ls-moments', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_moments').select('id, text, photo_url, created_at, featured')
        .eq('business_id', businessId).eq('status', 'approved')
        .order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(8);
      if (error) throw error;
      return data;
    },
  });
  const { data: recs } = useQuery({
    queryKey: ['ls-recs', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('recommendation_prompts').select('prompt_type, response, user_id').eq('business_id', businessId);
      if (error) throw error;
      return data;
    },
  });
  const { data: storedBadges } = useQuery({
    queryKey: ['ls-badges', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('reputation_badges').select('badge_type').eq('business_id', businessId);
      if (error) throw error;
      return data;
    },
  });

  const requireUser = () => {
    if (!user) { toast.error('Sign in to add your take.'); return false; }
    return true;
  };

  const toggleReaction = useMutation({
    mutationFn: async ({ type, mine }: { type: string; mine: boolean }) => {
      if (mine) {
        const { error } = await supabase.from('local_reactions').delete().eq('business_id', businessId).eq('user_id', user!.id).eq('reaction_type', type);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('local_reactions').insert({ business_id: businessId, user_id: user!.id, reaction_type: type, business_type: business.profileCategory });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ls-reactions', businessId] }),
    onError: () => toast.error('Could not update your reaction.'),
  });

  const addMoment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('local_moments').insert({ business_id: businessId, user_id: user!.id, text: momentText.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ls-moments', businessId] });
      setMomentText(''); setComposing(false);
      toast.success('Thanks for sharing your moment!');
    },
    onError: () => toast.error('Could not share your moment.'),
  });

  const answer = useMutation({
    mutationFn: async ({ type, response }: { type: string; response: boolean }) => {
      const { error } = await supabase.from('recommendation_prompts')
        .upsert({ business_id: businessId, user_id: user!.id, prompt_type: type, response }, { onConflict: 'business_id,user_id,prompt_type' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ls-recs', businessId] }),
    onError: () => toast.error('Could not record your answer.'),
  });

  // Aggregates
  const counts: Record<string, number> = {};
  (reactions ?? []).forEach((r) => { counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1; });
  const mine = new Set((reactions ?? []).filter((r) => r.user_id === user?.id).map((r) => r.reaction_type));
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const options = reactionOptionsFor(business.profileCategory).slice().sort((a, b) => (counts[b.type] || 0) - (counts[a.type] || 0));

  const knownFor = Array.from(new Set(ranked.slice(0, 6).map(([t]) => knownForTrait(t)))).slice(0, 6);
  const badges = Array.from(new Set([
    ...(storedBadges ?? []).map((b) => b.badge_type),
    ...ranked.filter(([t, c]) => c >= BADGE_THRESHOLD && badgeForReaction(t)).map(([t]) => badgeForReaction(t) as string),
  ]));
  const loves = ranked.slice(0, 3).map(([t]) => loveSentence(t));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Local Signals</h2>
        <p className="text-sm text-muted-foreground">How locals experience this place.</p>
      </div>

      {/* A. Locals describe this place as / tap to add */}
      <ProfileCard className="space-y-2">
        <p className="text-sm font-semibold">Locals describe this place as</p>
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const count = counts[o.type] || 0;
            const isMine = mine.has(o.type);
            return (
              <button
                key={o.type}
                onClick={() => requireUser() && toggleReaction.mutate({ type: o.type, mine: isMine })}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  isMine ? 'border-primary bg-primary/10 text-primary' : count > 0 ? 'border-border bg-secondary text-foreground/80' : 'border-border text-muted-foreground hover:bg-secondary'
                )}
              >
                {isMine && <Check className="h-3 w-3" />}
                {o.label}
                {count > 0 && <span className="opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Tap how you'd describe it — your take helps locals discover this place.</p>
      </ProfileCard>

      {/* B. Known For */}
      {knownFor.length > 0 && (
        <div>
          <SectionLabel>Known for</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {knownFor.map((trait) => (
              <span key={trait} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground/80">{trait}</span>
            ))}
          </div>
        </div>
      )}

      {/* C. Community Reputation */}
      {badges.length > 0 && (
        <div>
          <SectionLabel>Community reputation</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div key={b} className="inline-flex items-center gap-1.5 rounded-xl border border-lokal-amber/30 bg-lokal-amber/10 px-3 py-1.5 text-sm font-semibold text-lokal-amber">
                <Award className="h-4 w-4" /> {b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. What Locals Love */}
      {loves.length > 0 && (
        <div>
          <SectionLabel>What locals love</SectionLabel>
          <div className="space-y-2">
            {loves.map((line, i) => (
              <ProfileCard key={i} className="flex items-start gap-2">
                <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-sm text-foreground/90">{line}</p>
              </ProfileCard>
            ))}
          </div>
        </div>
      )}

      {/* E. Local Moments */}
      <div>
        <SectionLabel action={
          <button onClick={() => (requireUser() && setComposing((v) => !v))} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <MessageSquarePlus className="h-3.5 w-3.5" /> Share a moment
          </button>
        }>Local moments</SectionLabel>

        {composing && (
          <ProfileCard className="mb-2 space-y-2">
            <Textarea value={momentText} onChange={(e) => setMomentText(e.target.value)} placeholder="A quick, positive moment — “Found my new favorite Saturday spot.”" rows={2} maxLength={280} />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setComposing(false); setMomentText(''); }}>Cancel</Button>
              <Button size="sm" disabled={!momentText.trim() || addMoment.isPending} onClick={() => addMoment.mutate()}>Share</Button>
            </div>
          </ProfileCard>
        )}

        {moments && moments.length > 0 ? (
          <div className="space-y-2">
            {moments.map((m) => (
              <ProfileCard key={m.id} className="flex items-start gap-2">
                <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground/90">{m.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                </div>
              </ProfileCard>
            ))}
          </div>
        ) : !composing && (
          <EmptyState icon={MessageSquarePlus} title="Be the first to share a moment" description="A short, positive note about your visit shows up here." />
        )}
      </div>

      {/* F. Would you bring someone here? */}
      <div>
        <SectionLabel>Would you bring someone here?</SectionLabel>
        <div className="space-y-2">
          {RECOMMENDATION_PROMPTS.map((p) => {
            const forPrompt = (recs ?? []).filter((r) => r.prompt_type === p.type);
            const total = forPrompt.length;
            const yes = forPrompt.filter((r) => r.response).length;
            const pct = total > 0 ? Math.round((yes / total) * 100) : null;
            const myAnswer = (recs ?? []).find((r) => r.prompt_type === p.type && r.user_id === user?.id)?.response;
            return (
              <ProfileCard key={p.type} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  {pct !== null ? (
                    <p className="text-sm font-medium text-foreground"><span className="text-primary">{pct}%</span> of locals {p.stat}</p>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{p.question}</p>
                  )}
                  {pct !== null && <p className="text-xs text-muted-foreground">{p.question}</p>}
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <button
                    onClick={() => requireUser() && answer.mutate({ type: p.type, response: true })}
                    className={cn('flex h-8 w-8 items-center justify-center rounded-full border transition-colors', myAnswer === true ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-secondary')}
                    aria-label="Yes"
                  ><Check className="h-4 w-4" /></button>
                  <button
                    onClick={() => requireUser() && answer.mutate({ type: p.type, response: false })}
                    className={cn('flex h-8 w-8 items-center justify-center rounded-full border transition-colors', myAnswer === false ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:bg-secondary')}
                    aria-label="No"
                  ><X className="h-4 w-4" /></button>
                </div>
              </ProfileCard>
            );
          })}
        </div>
      </div>

      {/* Vibe match (personalization-ready) */}
      <ProfileCard className="flex items-start gap-3 border-primary/20 bg-primary/5">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Good match for you</p>
          <p className="text-xs text-muted-foreground">
            Because you like cozy, locally owned places{ranked[0] ? ` — and locals call this ${reactionLabel(ranked[0][0]).toLowerCase()}` : ''}.
          </p>
        </div>
      </ProfileCard>
    </div>
  );
}
