import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getFilledModulesForSection, getModuleImages } from '@/lib/profile-modules';
import { BUSINESS_TYPE_CONFIG } from '@/lib/business-profile-config';
import { ProfileBusiness } from './profile-types';
import { ModuleCard } from './ModuleCard';
import { EmptyState, SectionLabel } from './ProfilePrimitives';

export function PhotosTab({ business }: { business: ProfileBusiness }) {
  const [active, setActive] = useState<string | null>(null);
  const galleryModules = getFilledModulesForSection(business.profileCategory, business.moduleContent, 'photos');
  const mediaLabel = BUSINESS_TYPE_CONFIG[business.profileCategory].mediaLabel;

  // General photos + any images attached to this category's gallery modules.
  const moduleImages = getModuleImages(business.profileCategory, business.moduleContent);
  const photos = Array.from(new Set([...(business.photos ?? []), ...moduleImages].filter(Boolean)));

  return (
    <div className="space-y-3">
      <SectionLabel>{mediaLabel}</SectionLabel>

      {galleryModules.map((module) => (
        <ModuleCard key={module.id} module={module} values={business.moduleContent[module.id]} />
      ))}

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((path, i) => (
            <button
              key={`${path}-${i}`}
              onClick={() => setActive(path)}
              className="aspect-square overflow-hidden rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <SecureImage storagePath={path} alt={`${business.name} photo ${i + 1}`} className="h-full w-full" imgClassName="object-cover transition-transform hover:scale-105" />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No photos yet"
          description={`${business.name} hasn't added any photos yet.`}
        />
      )}

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl border-none bg-black p-0">
          {active && <SecureImage storagePath={active} alt={business.name} className="h-full max-h-[80vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
