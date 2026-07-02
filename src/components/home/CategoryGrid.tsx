import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryCard } from './CategoryCard';
import {
  Utensils,
  ShoppingBag,
  Building2,
  Car,
  Calendar,
  Home,
  HeartHandshake,
  HeartPulse,
  Palette,
  GraduationCap,
  Sparkles,
  Briefcase,
  Baby,
  Mountain,
  Wrench,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'building-2': Building2,
  'sparkles': Sparkles,
  'car': Car,
  'calendar': Calendar,
  'home': Home,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  'palette': Palette,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'baby': Baby,
  'mountain': Mountain,
  'wrench': Wrench,
};

const NONPROFIT_CATEGORY_NAME = 'Volunteer & Nonprofit';

export function CategoryGrid() {
  const { data: categories } = useCategories();
  const { data: counts } = useCategoryCounts();
  const { isNonprofit } = useAuth();

  const visibleCategories = categories?.filter(
    c => isNonprofit || c.name !== NONPROFIT_CATEGORY_NAME
  );

  if (!visibleCategories?.length) return null;

  return (
    <section className="px-4 py-6">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-xl font-bold text-foreground">Browse Categories</h2>
        <Link
          to="/explore"
          className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {visibleCategories.map((category) => {
          const IconComponent = iconMap[category.icon || ''] || Building2;
          return (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              icon={IconComponent}
              count={counts?.[category.id]}
            />
          );
        })}
      </div>
    </section>
  );
}
