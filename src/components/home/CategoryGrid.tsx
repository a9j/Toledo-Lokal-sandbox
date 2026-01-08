import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { 
  Utensils, 
  ShoppingBag, 
  Building2, 
  Landmark, 
  Dumbbell, 
  Music, 
  Heart, 
  Sparkles,
  Car,
  Briefcase,
  Calendar,
  Home,
  HeartHandshake,
  HeartPulse,
  Scissors,
  Palette,
  GraduationCap,
  PawPrint
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'building-2': Building2,
  'landmark': Landmark,
  'dumbbell': Dumbbell,
  'music': Music,
  'heart': Heart,
  'sparkles': Sparkles,
  'car': Car,
  'briefcase': Briefcase,
  'calendar': Calendar,
  'home': Home,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  'scissors': Scissors,
  'palette': Palette,
  'graduation-cap': GraduationCap,
  'paw-print': PawPrint,
};

const colorMap: Record<string, string> = {
  'Food & Drink': 'bg-orange-50 text-orange-600',
  'Shopping': 'bg-pink-50 text-pink-600',
  'Health & Wellness': 'bg-green-50 text-green-600',
  'Beauty': 'bg-purple-50 text-purple-600',
  'Home Services': 'bg-amber-50 text-amber-600',
  'Local Pros': 'bg-teal-50 text-teal-600',
  'Events & Venues': 'bg-indigo-50 text-indigo-600',
  'Arts & Culture': 'bg-fuchsia-50 text-fuchsia-600',
  'Auto & Transport': 'bg-blue-50 text-blue-600',
  'Education': 'bg-cyan-50 text-cyan-600',
  'Pets': 'bg-lime-50 text-lime-600',
  'Volunteer & Nonprofit': 'bg-rose-50 text-rose-600',
};

export function CategoryGrid() {
  const { data: categories } = useCategories();

  if (!categories?.length) return null;

  return (
    <section className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Browse Categories</h2>
        <Link to="/explore" className="text-sm font-medium text-primary hover:underline">
          See all
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {categories.slice(0, 8).map((category) => {
          const iconKey = category.icon || 'building-2';
          const IconComponent = iconMap[iconKey] || Building2;
          const colorClasses = colorMap[category.name] || 'bg-secondary text-foreground';

          return (
            <Link
              key={category.id}
              to={`/explore?category=${category.id}`}
              className="category-chip"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {category.name.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
