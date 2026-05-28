import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface PulseIconProps extends LucideProps {
  name: string | null | undefined;
  fallback?: keyof typeof Icons;
}

// Resolves a lucide icon by name from our config strings. Falls back gracefully
// so a renamed/missing icon never crashes the feed.
export function PulseIcon({ name, fallback = 'Circle', ...props }: PulseIconProps) {
  const lib = Icons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Cmp = (name && lib[name]) || lib[fallback] || Icons.Circle;
  return <Cmp {...props} />;
}
