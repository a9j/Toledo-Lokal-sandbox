import { ExternalLink, Phone } from 'lucide-react';
import { ProfileModule, ModuleFieldValue } from '@/lib/profile-modules';
import { ProfileCard } from './ProfilePrimitives';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

// Renders one module's filled-in content. Shared by every category.
export function ModuleCard({ module, values }: { module: ProfileModule; values: Record<string, ModuleFieldValue> }) {
  return (
    <ProfileCard className="space-y-1.5">
      <h4 className="text-sm font-semibold text-foreground">{module.title}</h4>
      {module.fields.map((field) => {
        // Images are rendered by the Photos tab, not inline here.
        if (field.type === 'images') return null;
        const raw = values[field.key];
        const value = typeof raw === 'string' ? raw.trim() : '';
        if (!value) return null;

        if (field.type === 'url') {
          const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
          return (
            <a key={field.key} href={href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              {field.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          );
        }
        if (field.type === 'tel') {
          return (
            <a key={field.key} href={`tel:${value.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" />
              {value}
            </a>
          );
        }
        return (
          <p key={field.key} className="text-sm text-muted-foreground whitespace-pre-line">
            {field.type === 'date' ? formatDate(value) : value}
          </p>
        );
      })}
    </ProfileCard>
  );
}
