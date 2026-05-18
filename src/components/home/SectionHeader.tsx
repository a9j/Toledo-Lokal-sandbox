import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  viewAllLink?: string;
}

export function SectionHeader({ title, viewAllLink }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-5">
      <h2
        className="text-2xl md:text-3xl font-normal text-foreground tracking-tight"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.015em', lineHeight: 1.05 }}
      >
        {title}
      </h2>
      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="flex items-center gap-0.5 text-xs uppercase tracking-[0.12em] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
