interface AboutCardProps {
  description: string | null | undefined;
}

export function AboutCard({ description }: AboutCardProps) {
  if (!description) return null;

  // Limit to ~3 sentences worth - about 200 characters
  const shortDescription = description.length > 250 
    ? description.substring(0, 250).trim() + '...'
    : description;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        About
      </h2>
      <p className="text-foreground leading-relaxed text-[15px]">
        {shortDescription}
      </p>
    </div>
  );
}
