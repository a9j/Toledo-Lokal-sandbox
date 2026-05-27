import { ExternalLink, Phone } from 'lucide-react';
import {
  BusinessCategory,
  ProfileModule,
  ProfileModuleContent,
  PROFILE_SECTION_ORDER,
  PROFILE_SECTION_LABELS,
  getFilledModules,
} from '@/lib/profile-modules';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

// One shared card used by every module, every category. Content changes; the
// aesthetic does not.
function ModuleCard({ module, values }: { module: ProfileModule; values: Record<string, string> }) {
  return (
    <div className="card-elevated p-4 space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{module.title}</h4>
      <div className="space-y-1.5">
        {module.fields.map((field) => {
          const value = values[field.key]?.trim();
          if (!value) return null;

          if (field.type === 'url') {
            const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
            return (
              <a
                key={field.key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {field.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            );
          }

          if (field.type === 'tel') {
            return (
              <a
                key={field.key}
                href={`tel:${value.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {value}
              </a>
            );
          }

          const display = field.type === 'date' ? formatDate(value) : value;
          return (
            <p key={field.key} className="text-sm text-muted-foreground whitespace-pre-line">
              {display}
            </p>
          );
        })}
      </div>
    </div>
  );
}

interface CategoryModulesProps {
  category: BusinessCategory;
  content: ProfileModuleContent;
}

// Renders the category's filled-in modules grouped into the fixed shell
// sections, in order. Sections with no content render nothing (no empty headers).
export function CategoryModules({ category, content }: CategoryModulesProps) {
  const filled = getFilledModules(category, content);
  if (filled.length === 0) return null;

  return (
    <div className="space-y-6">
      {PROFILE_SECTION_ORDER.map((section) => {
        const modules = filled.filter((m) => m.section === section);
        if (modules.length === 0) return null;
        return (
          <section key={section} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {PROFILE_SECTION_LABELS[section]}
            </h3>
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} values={content[module.id]} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
