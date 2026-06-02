import { Circle, type LucideProps } from 'lucide-react';
import { resolveIcon } from '@/lib/icon-resolver';

interface PulseIconProps extends LucideProps {
  name: string | null | undefined;
}

export function PulseIcon({ name, ...props }: PulseIconProps) {
  const Cmp = resolveIcon(name, Circle);
  return <Cmp {...props} />;
}
