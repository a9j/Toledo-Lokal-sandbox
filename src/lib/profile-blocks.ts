// Profile block engine.
//
// A profile is one engine made of toggleable blocks. A "template" is just a
// preset of which blocks are enabled and in what order. This file is the single
// source of truth for the block library, the launch presets, and the logic that
// infers a preset during onboarding (category + one question). It is pure (no
// React, no Supabase) so it can be unit-tested in isolation.

export type BlockType =
  | 'hero'
  | 'about'
  | 'hours_location'
  | 'schedule_stops'
  | 'menu'
  | 'catalog'
  | 'booking'
  | 'events'
  | 'donation_volunteer'
  | 'portfolio'
  | 'live_updates'
  | 'gallery'
  | 'follow_contact';

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  /** Hero and follow/contact are structural and can't be turned off. */
  required?: boolean;
}

// The full block library, in a sensible default vertical order.
export const BLOCK_LIBRARY: BlockDefinition[] = [
  { type: 'hero', label: 'Hero', description: 'Name, category, open/closed status, primary action.', required: true },
  { type: 'about', label: 'About', description: 'Your Lokal Story — the editorial intro to your business.' },
  { type: 'hours_location', label: 'Hours & Location', description: 'Fixed address and opening hours.' },
  { type: 'schedule_stops', label: 'Schedule & Stops', description: 'A moving-location schedule (food trucks, pop-ups, vendors).' },
  { type: 'menu', label: 'Menu', description: 'A photo or digital menu.' },
  { type: 'catalog', label: 'Catalog', description: 'Retail products for sale.' },
  { type: 'booking', label: 'Booking', description: 'Let people request bookings (services, fitness, catering).' },
  { type: 'events', label: 'Events', description: 'Events you host or are part of.' },
  { type: 'donation_volunteer', label: 'Donate & Volunteer', description: 'Nonprofit giving and volunteer signups.' },
  { type: 'portfolio', label: 'Portfolio', description: 'Showcase creator/artist work.' },
  { type: 'live_updates', label: 'Live Updates', description: 'Owner-controlled posts (not AI).' },
  { type: 'gallery', label: 'Gallery', description: 'Photos of your business.' },
  { type: 'follow_contact', label: 'Follow & Contact', description: 'Follow the business and get in touch.', required: true },
];

export const BLOCK_LABELS: Record<BlockType, string> = BLOCK_LIBRARY.reduce(
  (acc, b) => ({ ...acc, [b.type]: b.label }),
  {} as Record<BlockType, string>
);

export const REQUIRED_BLOCKS: BlockType[] = BLOCK_LIBRARY.filter((b) => b.required).map((b) => b.type);

export type PresetId = 'standard' | 'food_truck' | 'nonprofit';

export interface Preset {
  id: PresetId;
  label: string;
  /** Block types in render order. */
  blocks: BlockType[];
}

// The 3 launch presets. Each is just an ordered list of enabled blocks.
export const PRESETS: Record<PresetId, Preset> = {
  standard: {
    id: 'standard',
    label: 'Standard',
    blocks: ['hero', 'about', 'hours_location', 'menu', 'gallery', 'live_updates', 'follow_contact'],
  },
  food_truck: {
    id: 'food_truck',
    label: 'Food Truck',
    blocks: ['hero', 'schedule_stops', 'menu', 'live_updates', 'booking', 'gallery', 'follow_contact'],
  },
  nonprofit: {
    id: 'nonprofit',
    label: 'Nonprofit',
    blocks: ['hero', 'about', 'donation_volunteer', 'events', 'gallery', 'follow_contact'],
  },
};

/**
 * Infer the launch preset from a business's browse category and the one
 * onboarding question — "fixed location, or do you move around?".
 *
 *  - Moving (mobile) → Food Truck preset.
 *  - Nonprofits & Community category → Nonprofit preset.
 *  - Everything else → Standard.
 *
 * `categoryName` is matched loosely so it works with the browse category label
 * (e.g. "Nonprofits & Community", "Food & Drink").
 */
export function inferPreset(input: { categoryName?: string | null; movesAround?: boolean }): PresetId {
  const name = (input.categoryName ?? '').toLowerCase();

  if (input.movesAround) return 'food_truck';
  if (name.includes('nonprofit') || name.includes('non-profit') || name.includes('community')) {
    return 'nonprofit';
  }
  return 'standard';
}

export interface SeedBlock {
  block_type: BlockType;
  enabled: boolean;
  sort_order: number;
}

/**
 * Build the rows to seed into profile_blocks for a given preset. Blocks in the
 * preset are enabled in order; every other block in the library is added
 * disabled (so owners can toggle them on later without a migration).
 */
export function buildPresetBlocks(presetId: PresetId): SeedBlock[] {
  const preset = PRESETS[presetId];
  const inPreset = new Set(preset.blocks);

  const enabled: SeedBlock[] = preset.blocks.map((block_type, i) => ({
    block_type,
    enabled: true,
    sort_order: i,
  }));

  const disabled: SeedBlock[] = BLOCK_LIBRARY.filter((b) => !inPreset.has(b.type)).map((b, i) => ({
    block_type: b.type,
    enabled: false,
    sort_order: preset.blocks.length + i,
  }));

  return [...enabled, ...disabled];
}
