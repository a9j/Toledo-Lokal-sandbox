import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useCity } from '@/contexts/CityContext';

/**
 * The one way in to Ask Toledo, on every screen.
 *
 * The roadmap asked for this to be wired to the search screen "for now",
 * which was written before Ask Toledo existed. It does now, at /ask, so the
 * button goes to the real thing; /search is still there for structured
 * searching and Ask links across to it.
 *
 * It sits above the tab bar rather than over content, so it never covers the
 * last row of a list. Hidden on the two screens it would lead to, and on the
 * screens that hide the tab bar, because a floating button over a sign in
 * form is just clutter.
 */
export function AskToledoButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { city } = useCity();

  const hiddenPaths = [
    '/auth', '/scanner-mode', '/accept-invitation', '/join', '/save', '/beta',
    '/search', '/ask',
  ];
  if (hiddenPaths.some((path) => location.pathname.startsWith(path))) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/ask')}
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
