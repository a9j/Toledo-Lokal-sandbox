import { Check, Circle, CheckCircle2 } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  description: 'a short description',
  address: 'your address',
  logo: 'a logo',
  phone: 'a phone number',
  hours: 'your hours',
  photos: 'at least one photo',
};

interface ProfileCompletionProps {
  missingFields: string[] | null | undefined;
  isLoading?: boolean;
}

export function ProfileCompletion({ missingFields, isLoading }: ProfileCompletionProps) {
  if (isLoading || missingFields === undefined) return null;

  const missing = missingFields ?? [];

  if (missing.length === 0) {
    return (
      <div className="rounded-2xl border border-[#D4A853]/30 bg-[#FBF9F4] p-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#D4A853]" />
          <p className="text-sm font-medium text-[#0F1D35]" style={{ fontFamily: 'Geist, sans-serif' }}>
            Your profile is complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D4A853]/30 bg-[#FBF9F4] p-4">
      <h3
        className="mb-3 text-sm font-semibold text-[#0F1D35]"
        style={{ fontFamily: 'Fraunces, serif' }}
      >
        Complete your profile
      </h3>

      <ul className="space-y-2">
        {Object.keys(FIELD_LABELS).map((key) => {
          const done = !missing.includes(key);
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check className="h-4 w-4 flex-shrink-0 text-[#D4A853]" />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0 text-[#0F1D35]/25" />
              )}
              <span
                className={done ? 'text-[#0F1D35]/40 line-through' : 'text-[#0F1D35]'}
                style={{ fontFamily: 'Geist, sans-serif' }}
              >
                Add {FIELD_LABELS[key]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
