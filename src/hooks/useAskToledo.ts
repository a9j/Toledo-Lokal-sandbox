import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Ask Toledo, Phase 3.
 *
 * The edge function does the work: it turns the question into a query spec,
 * runs it against the CityGraph, and writes the answer from the rows it got
 * back. The client only renders what comes out, and every card corresponds to a
 * row the database actually returned, so nothing invented reaches the screen.
 */

export interface AskCard {
  bucket: 'businesses' | 'nonprofits' | 'events' | 'jobs' | 'deals' | 'changes';
  entity_id: string;
  /** Present on business, nonprofit and job cards. */
  name?: string;
  /** Present on event, job, deal and change cards. */
  title?: string;
  business_id?: string;
  nonprofit_id?: string;
  event_id?: string;
  job_id?: string;
  job_type?: string;
  slug?: string;
  category?: string;
  cause?: string;
  description?: string;
  mission?: string;
  body?: string;
  address?: string;
  location?: string;
  neighborhood?: string;
  starts_at?: string;
  is_free?: boolean;
  price_cents?: number | null;
  business_name?: string;
  event_type?: string;
  occurs_at?: string;
  distance_miles?: number | null;
}

export interface AskAnswer {
  answer: string;
  found_anything: boolean;
  cards: AskCard[];
  spec?: Record<string, unknown>;
}

export interface AskInput {
  question: string;
  /** Pins the search to one neighborhood. Used by "Ask [Neighborhood]". */
  neighborhoodId?: string | null;
  neighborhoodName?: string | null;
}

export function useAskToledo() {
  return useMutation<AskAnswer, Error, AskInput>({
    mutationFn: async ({ question, neighborhoodId, neighborhoodName }) => {
      const { data, error } = await supabase.functions.invoke('ask-toledo', {
        body: {
          question,
          neighborhood_id: neighborhoodId ?? null,
          neighborhood_name: neighborhoodName ?? null,
        },
      });
      if (error) throw new Error(error.message);

      const payload = data as Partial<AskAnswer> & { error?: string };
      // The function reports its own trouble in the body rather than as a
      // transport error, so a message here is the real one to show.
      if (payload?.error) throw new Error(payload.error);

      return {
        answer: payload.answer ?? '',
        found_anything: payload.found_anything ?? false,
        cards: payload.cards ?? [],
        spec: payload.spec,
      };
    },
  });
}

/** Where a card links to, or null when it has no page of its own. */
export function askCardPath(card: AskCard): string | null {
  if (card.business_id) return `/business/${card.business_id}`;
  if (card.event_id) return `/events/${card.event_id}`;
  if (card.slug) return `/community/${card.slug}`;
  return null;
}

/** The line under a card's title. */
export function askCardSubtitle(card: AskCard): string {
  const bits: string[] = [];

  if (card.category) bits.push(card.category.replace(/_/g, ' '));
  if (card.cause) bits.push(card.cause);
  if (card.job_type) bits.push(String(card.job_type).replace(/-/g, ' '));
  if (card.business_name) bits.push(card.business_name);
  if (card.neighborhood) bits.push(card.neighborhood);
  if (card.distance_miles != null) bits.push(`${card.distance_miles} mi`);

  return bits.join(' · ');
}
