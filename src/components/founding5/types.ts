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

export const FOUNDING_CATEGORY_OPTIONS: { value: FoundingCategory; label: string }[] = [
  { value: 'morning', label: 'Morning (coffee, breakfast)' },
  { value: 'evening', label: 'Evening (dinner, drinks)' },
  { value: 'retail', label: 'Retail (shops, goods)' },
  { value: 'experience', label: 'Experience (things to do)' },
  { value: 'other', label: 'Something else' },
];
