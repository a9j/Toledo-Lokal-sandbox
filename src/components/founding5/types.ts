export interface FoundingMember {
  id: string;
  slug: string | null;
  foundingNumber: number;
  name: string;
  ownerName: string | null;
  ownerImageUrl: string | null;
  heroImageUrl: string | null;
  neighborhood: string | null;
  quote: string | null;
}

export const FOUNDING_5_TOTAL = 5;

export type FoundingCategory =
  | 'morning'
  | 'evening'
  | 'retail'
  | 'experience'
  | 'other';

// TODO: confirm category meaning with owner
export const FOUNDING_CATEGORY_OPTIONS: { value: FoundingCategory; label: string; subtitle: string }[] = [
  { value: 'morning', label: 'Morning spot', subtitle: 'Coffee shops, bakeries, breakfast' },
  { value: 'evening', label: 'Evening spot', subtitle: 'Dinner, drinks, nightlife' },
  { value: 'retail', label: 'Retail', subtitle: 'Shops, boutiques, goods' },
  { value: 'experience', label: 'Experience', subtitle: 'Things to do, entertainment, classes' },
  { value: 'other', label: 'Something else', subtitle: 'Doesn’t fit the above' },
];
