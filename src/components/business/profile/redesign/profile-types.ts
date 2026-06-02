import { BusinessCategory, ProfileModuleContent } from '@/lib/profile-modules';

// The shape the redesigned profile + its tabs consume. The BusinessDetail query
// returns a superset of this (augmented with derived flags).
export interface ProfileBusiness {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  profile_picture_url: string | null;
  photos: string[] | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  visit_link_type: string | null;
  visit_link_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  hours: unknown;
  story: string | null;
  verified: boolean | null;
  owner_user_id?: string | null;
  category: { name: string; icon: string } | null;
  neighborhood: { name: string } | null;
  isFoodTruck: boolean;
  isNonprofit: boolean;
  isFoundingMember: boolean;
  isFounding50?: boolean;
  isInLoop?: boolean;
  tierStatus?: string | null;
  tierBadgeVisible?: boolean | null;
  tierAssignedAt?: string | null;
  profileCategory: BusinessCategory;
  moduleContent: ProfileModuleContent;
}
