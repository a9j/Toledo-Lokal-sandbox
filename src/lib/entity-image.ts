import type { EntityKind } from '@/integrations/supabase/city-os';

import business from '@/assets/placeholders/business.svg';
import content from '@/assets/placeholders/content.svg';
import deal from '@/assets/placeholders/deal.svg';
import event from '@/assets/placeholders/event.svg';
import governmentAction from '@/assets/placeholders/government_action.svg';
import issue from '@/assets/placeholders/issue.svg';
import job from '@/assets/placeholders/job.svg';
import neighborhood from '@/assets/placeholders/neighborhood.svg';
import opportunity from '@/assets/placeholders/opportunity.svg';
import organization from '@/assets/placeholders/organization.svg';
import person from '@/assets/placeholders/person.svg';
import place from '@/assets/placeholders/place.svg';
import project from '@/assets/placeholders/project.svg';
import property from '@/assets/placeholders/property.svg';
import resource from '@/assets/placeholders/resource.svg';
import transaction from '@/assets/placeholders/transaction.svg';

/**
 * Every entity has a picture, even when nobody has uploaded one.
 *
 * A gray box reads as broken and a missing image reads as an empty hole, so a
 * thing with no photograph still gets a tile: a gradient in the brand palette,
 * shaded by what kind of thing it is, so a list of cards looks varied without
 * leaving the palette. These are vector, so they are crisp at any size and add
 * about 4KB each.
 */
const PLACEHOLDERS: Record<EntityKind, string> = {
  person,
  place,
  business,
  organization,
  property,
  neighborhood,
  event,
  job,
  deal,
  resource,
  project,
  issue,
  transaction,
  government_action: governmentAction,
  opportunity,
  content,
};

export function placeholderFor(kind: string | null | undefined): string {
  if (kind && kind in PLACEHOLDERS) return PLACEHOLDERS[kind as EntityKind];
  return place;
}

export interface ImageSources {
  src: string;
  /** Only set when the source can actually be rendered at several widths. */
  srcSet?: string;
  sizes?: string;
  /** True when this is a stand in rather than a photograph of the real thing. */
  isPlaceholder: boolean;
}

/** The widths the layout asks for: a card, a hero, and a hero on a big screen. */
export const RENDER_WIDTHS = [400, 800, 1200] as const;

/**
 * Work out what to put in an <img> for one entity.
 *
 * `url` is whatever the caller already has: an existing cover_image_url, a
 * signed storage URL, or nothing. When there is nothing, the kind's tile is
 * used and the caller is told it is a placeholder so it can label it.
 *
 * On srcSet: a real size ladder needs Supabase image transformations, which
 * are a paid add-on and have to be requested when the URL is signed rather
 * than appended afterwards, or the signature stops matching. Until that is
 * enabled this returns a single src, which is correct rather than a srcSet of
 * three URLs that all resolve to the same bytes. The placeholders are vector
 * and need no ladder at all.
 */
export function imageSources(
  url: string | null | undefined,
  kind: string | null | undefined,
): ImageSources {
  if (!url) {
    return { src: placeholderFor(kind), isPlaceholder: true };
  }
  return { src: url, isPlaceholder: false };
}
