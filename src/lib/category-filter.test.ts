import { describe, it, expect } from 'vitest';
import { buildCategoryOrFilter } from './category-filter';

describe('buildCategoryOrFilter', () => {
  it('returns null when there are no secondary matches (caller uses plain eq)', () => {
    expect(buildCategoryOrFilter('cat-1', [])).toBeNull();
  });

  it('builds an OR of primary category_id and secondary business ids', () => {
    expect(buildCategoryOrFilter('cat-1', ['biz-a', 'biz-b'])).toBe(
      'category_id.eq.cat-1,id.in.(biz-a,biz-b)'
    );
  });

  it('handles a single secondary id', () => {
    expect(buildCategoryOrFilter('c', ['x'])).toBe('category_id.eq.c,id.in.(x)');
  });
});
