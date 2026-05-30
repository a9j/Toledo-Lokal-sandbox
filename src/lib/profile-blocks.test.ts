import { describe, it, expect } from 'vitest';
import {
  BLOCK_LIBRARY,
  PRESETS,
  REQUIRED_BLOCKS,
  inferPreset,
  buildPresetBlocks,
  type BlockType,
} from './profile-blocks';

describe('block library', () => {
  it('has unique block types', () => {
    const types = BLOCK_LIBRARY.map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('marks hero and follow_contact as required (always on)', () => {
    expect(REQUIRED_BLOCKS).toEqual(expect.arrayContaining(['hero', 'follow_contact']));
  });
});

describe('presets', () => {
  it('every preset starts with hero and ends with follow_contact', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(preset.blocks[0]).toBe('hero');
      expect(preset.blocks[preset.blocks.length - 1]).toBe('follow_contact');
    }
  });

  it('only references blocks that exist in the library', () => {
    const known = new Set(BLOCK_LIBRARY.map((b) => b.type));
    for (const preset of Object.values(PRESETS)) {
      for (const block of preset.blocks) {
        expect(known.has(block)).toBe(true);
      }
    }
  });

  it('food truck is built around schedule_stops, not hours_location', () => {
    expect(PRESETS.food_truck.blocks).toContain('schedule_stops');
    expect(PRESETS.food_truck.blocks).not.toContain('hours_location');
  });

  it('nonprofit includes donation_volunteer', () => {
    expect(PRESETS.nonprofit.blocks).toContain('donation_volunteer');
  });

  it('has no duplicate blocks within a preset', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(new Set(preset.blocks).size).toBe(preset.blocks.length);
    }
  });
});

describe('inferPreset', () => {
  it('returns food_truck whenever the business moves around, regardless of category', () => {
    expect(inferPreset({ categoryName: 'Food & Drink', movesAround: true })).toBe('food_truck');
    expect(inferPreset({ categoryName: 'Shopping', movesAround: true })).toBe('food_truck');
  });

  it('returns nonprofit for community/nonprofit categories when fixed', () => {
    expect(inferPreset({ categoryName: 'Nonprofits & Community' })).toBe('nonprofit');
    expect(inferPreset({ categoryName: 'non-profit org' })).toBe('nonprofit');
  });

  it('moving beats a nonprofit category', () => {
    expect(inferPreset({ categoryName: 'Nonprofits & Community', movesAround: true })).toBe(
      'food_truck'
    );
  });

  it('falls back to standard', () => {
    expect(inferPreset({ categoryName: 'Food & Drink' })).toBe('standard');
    expect(inferPreset({ categoryName: null })).toBe('standard');
    expect(inferPreset({})).toBe('standard');
  });
});

describe('buildPresetBlocks', () => {
  it('enables exactly the preset blocks, in order, and includes every other block disabled', () => {
    const rows = buildPresetBlocks('standard');

    // One row per block in the library (enabled preset + disabled remainder).
    expect(rows).toHaveLength(BLOCK_LIBRARY.length);

    const enabled = rows.filter((r) => r.enabled).map((r) => r.block_type);
    expect(enabled).toEqual(PRESETS.standard.blocks);

    // sort_order is contiguous and unique across all rows.
    const orders = rows.map((r) => r.sort_order).sort((a, b) => a - b);
    expect(orders).toEqual(rows.map((_, i) => i));
  });

  it('disabled blocks are exactly the library minus the preset', () => {
    const rows = buildPresetBlocks('nonprofit');
    const disabled = new Set(rows.filter((r) => !r.enabled).map((r) => r.block_type));
    const expectedDisabled = BLOCK_LIBRARY.map((b) => b.type).filter(
      (t: BlockType) => !PRESETS.nonprofit.blocks.includes(t)
    );
    expect(disabled).toEqual(new Set(expectedDisabled));
  });

  it('every library block appears exactly once', () => {
    const rows = buildPresetBlocks('food_truck');
    const types = rows.map((r) => r.block_type);
    expect(new Set(types).size).toBe(BLOCK_LIBRARY.length);
  });
});
