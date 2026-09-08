import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCity } from '@/contexts/CityContext';

/**
 * The one way in to search, on every screen.
 *
 * It sits above the tab bar rather than over content, so it never covers the
 * last row of a list. Hidden on the search screen itself and on the screens
 * that hide the tab bar, because a floating button over a sign in form is
 * just clutter.
 */
export function AskToledoButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { city } = useCity();

  const hiddenPaths = [
    '/auth', '/scanner-mode', '/accept-invitation', '/join', '/save', '/beta', '/search',
  ];
  if (hiddenPaths.some((path) => location.pathname.startsWith(path))) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/search')}
      aria-label={`Ask ${city.name}`}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3
                 text-sm font-semibold text-primary-foreground shadow-lg
                 transition-transform active:scale-95 safe-area-bottom"
    >
      <Search className="h-4 w-4" />
      Ask {city.name}
    </button>
  );
}
