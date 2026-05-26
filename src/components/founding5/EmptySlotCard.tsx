interface EmptySlotCardProps {
  slotNumber: number;
  onApply: () => void;
}

const padded = (n: number) => String(n).padStart(2, '0');

export function EmptySlotCard({ slotNumber, onApply }: EmptySlotCardProps) {
  return (
    <button
      type="button"
      onClick={onApply}
      className="group flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-transparent text-center transition-colors duration-300 hover:border-amber-400 hover:bg-amber-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:hover:bg-amber-950/10"
    >
      <span className="font-display text-6xl font-bold tracking-tight text-muted-foreground/40 transition-colors group-hover:text-amber-400 sm:text-7xl">
        {padded(slotNumber)}
      </span>
      <span className="text-base font-medium text-muted-foreground">
        Reserved for a Toledo original.
      </span>
    </button>
  );
}
