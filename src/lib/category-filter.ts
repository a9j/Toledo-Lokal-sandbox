// Pure helper for browse-by-category filtering.
//
// A business appears in a category bucket via its primary category
// (businesses.category_id) OR via a secondary tag in business_categories. When
// there are secondary matches we build a PostgREST `.or()` string; otherwise the
// caller falls back to a plain equality on category_id.

/**
 * Returns the PostgREST `.or()` filter string for a category bucket, or null if
 * a plain `category_id` equality is sufficient (no secondary matches).
 */
export function buildCategoryOrFilter(
  categoryId: string,
  secondaryBusinessIds: string[]
): string | null {
  if (secondaryBusinessIds.length === 0) return null;
  return `category_id.eq.${categoryId},id.in.(${secondaryBusinessIds.join(',')})`;
}
