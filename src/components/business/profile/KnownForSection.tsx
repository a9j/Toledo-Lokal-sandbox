import { Star, Sparkles } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface KnownForSectionProps {
  items?: string[];
}

export function KnownForSection({ items }: KnownForSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <CollapsibleSection title="What They're Known For" icon={Sparkles} defaultOpen>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm"
          >
            <Star className="h-3 w-3 text-lokal-amber" />
            {item}
          </span>
        ))}
      </div>
    </CollapsibleSection>
  );
}
