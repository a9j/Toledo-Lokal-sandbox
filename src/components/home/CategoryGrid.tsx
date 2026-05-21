import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import {
  Utensils,
  ShoppingBag,
  Building2,
  Dumbbell,
  Heart,
  Car,
  Calendar,
  Home,
  HeartHandshake,
  HeartPulse,
  Palette,
  GraduationCap,
  PawPrint,
  MapPin,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'building-2': Building2,
  'dumbbell': Dumbbell,
  'heart': Heart,
  'sparkles': Sparkles,
  'car': Car,
  'calendar': Calendar,
  'home': Home,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  'palette': Palette,
  'graduation-cap': GraduationCap,
  'paw-print': PawPrint,
  'map-pin': MapPin,
};

export function CategoryGrid() {
  const { data: categories } = useCategories();

  if (!categories?.length) return null;

  const visible = categories.slice(0, 12);

  return (
    <section className="px-4 py-6">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-xl font-bold text-foreground">Browse Categories</h2>
        <Link
          to="/explore"
          className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
        >
          View all {categories.length}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {visible.map((category) => {
          const iconKey = category.icon || 'building-2';
          const IconComponent = iconMap[iconKey] || Building2;

          return (
            <Link
              key={category.id}
              to={`/explore?category=${category.id}`}
              className="flex flex-col items-center justify-center gap-1.5 aspect-square rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <IconComponent className="h-6 w-6 text-primary" strokeWidth={1.8} />
              <span className="text-[11px] font-semibold text-foreground/90 text-center leading-tight px-1 truncate max-w-full">
                {category.name.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
