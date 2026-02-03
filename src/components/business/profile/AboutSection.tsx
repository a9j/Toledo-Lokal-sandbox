import { Info } from 'lucide-react';

interface AboutSectionProps {
  description?: string | null;
}

export function AboutSection({ description }: AboutSectionProps) {
  if (!description) return null;

  // Limit to ~3 short lines (about 200 characters per spec)
  const shortDescription = description.length > 200 
    ? description.substring(0, 200).trim() + '...'
    : description;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        <Info className="h-4 w-4" />
        About
      </h2>
      <p className="text-foreground leading-relaxed text-[15px]">
        {shortDescription}
      </p>
    </div>
  );
}
