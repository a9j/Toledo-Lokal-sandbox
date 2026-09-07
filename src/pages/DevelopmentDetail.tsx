import { useParams, Link } from 'react-router-dom';
import { Check, FileText, MapPin, CalendarClock, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { FollowButton } from '@/components/city-os/FollowButton';
import { RecentChanges } from '@/components/city-os/RecentChanges';
import { CityMemory } from '@/components/city-os/CityMemory';
import { useDevelopment, developmentStatusLabel } from '@/hooks/useCityChange';

/** The line a project walks. Stalled and cancelled step off it. */
const TRACK = ['proposed', 'under_review', 'approved', 'under_construction', 'completed'];

function StatusTrack({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'stalled') {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/50 p-3.5">
        <p className="text-sm font-medium">
          {status === 'cancelled' ? 'Not going ahead' : 'On hold'}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {status === 'cancelled'
            ? 'This one was cancelled.'
            : 'Work has stopped for now. Follow it to hear if it starts again.'}
        </p>
      </div>
    );
  }

  const current = TRACK.indexOf(status);

  return (
    <div className="flex items-center">
      {TRACK.map((step, i) => {
        const done = i <= current;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ' +
                  (done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-card text-muted-foreground')
                }
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={
                  'text-center text-[10px] leading-tight ' +
                  (done ? 'font-medium text-foreground' : 'text-muted-foreground')
                }
              >
                {developmentStatusLabel(step)}
              </span>
            </div>
            {i < TRACK.length - 1 && (
              <div
                className={'mx-1 mb-5 h-0.5 flex-1 rounded ' + (i < current ? 'bg-primary' : 'bg-border')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DocumentEntry {
  label?: string;
  url?: string | null;
}

function documentList(documents: unknown): DocumentEntry[] {
  const record = documents as { files?: unknown } | null;
  const files = Array.isArray(record?.files) ? record.files : [];
  return files.filter(
    (f): f is DocumentEntry => typeof f === 'object' && f !== null && 'label' in f,
  );
}

export default function DevelopmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error } = useDevelopment(id);

  if (isLoading) {
    return (
      <>
        <Header title="Project" showBack />
        <PageContainer>
          <Skeleton className="h-40 w-full rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <Header title="Project" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <h1 className="font-heading text-lg font-semibold">
              {error ? 'Could not load this project' : 'Project not found'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {error ? 'Check your connection and try again.' : 'It may have been removed.'}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/built">Back to the radar</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const files = documentList(project.documents);

  return (
    <>
      <Header title="Project" showBack />
      <PageContainer>
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {developmentStatusLabel(project.status)}
            </Badge>
            {project.kind && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {project.kind.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.summary && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <StatusTrack status={project.status} />
        </div>

        <dl className="mt-4 space-y-3 rounded-xl border border-border/60 bg-card p-4 text-sm">
          {project.developer && (
            <div className="flex gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Developer</dt>
                <dd className="font-medium">{project.developer}</dd>
              </div>
            </div>
          )}
          {project.address && (
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Where</dt>
                <dd className="font-medium">{project.address}</dd>
              </div>
            </div>
          )}
          {project.est_completion && (
            <div className="flex gap-3">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Expected</dt>
                <dd className="font-medium">
                  {new Date(project.est_completion).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </div>
          )}
          {project.planning_case && (
            <div className="flex gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Planning case</dt>
                <dd className="font-medium tabular-nums">{project.planning_case}</dd>
              </div>
            </div>
          )}
        </dl>

        {files.length > 0 && (
          <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Documents</h2>
            <ul className="mt-2 space-y-1.5">
              {files.map((file) => (
                <li key={file.label} className="text-sm">
                  {file.url ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary"
                    >
                      {file.label}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      {file.label} — not published online yet
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <FollowButton
            source={{ table: 'developments', id: project.id }}
            label="Follow this project"
            className="w-full"
          />
        </div>

        <div className="mt-6">
          <RecentChanges
            source={{ table: 'developments', id: project.id }}
            title="What has happened"
          />
        </div>

        <div className="mt-6">
          <CityMemory
            source={{ table: 'developments', id: project.id }}
            title="What used to be here"
          />
        </div>

        <p className="mt-6 text-xs leading-snug text-muted-foreground">
          Sandbox data. This project is made up for testing and does not describe anything real.
        </p>
      </PageContainer>
    </>
  );
}
