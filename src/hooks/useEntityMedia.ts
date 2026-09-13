import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { artUrl } from '@/lib/bundled-art';

/**
 * The pictures for one entity.
 *
 * entity_media keys images to city_entities rather than to each source table,
 * so one query covers a business, a neighbourhood, a parcel, a job or anything
 * else the registry holds. A row points at either a real upload
 * (`storage_path`) or a drawing committed to the repo (`bundled_key`); this
 * resolves whichever it is into something an <img> can take, so no screen has
 * to know which kind it got.
 */

export interface EntityPicture {
  id: string;
  /** Ready for an img src: a storage path is left alone for SecureImage. */
  src: string;
  /** True when the source was a storage upload and still needs signing. */
  needsSigning: boolean;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export interface EntityMedia {
  hero: EntityPicture | null;
  logo: EntityPicture | null;
  gallery: EntityPicture[];
}

const EMPTY: EntityMedia = { hero: null, logo: null, gallery: [] };

export function useEntityMedia(entityId?: string | null) {
  return useQuery({
    queryKey: ['entity-media', entityId],
    enabled: !!entityId,
    // The art does not change while somebody is looking at a page, and these
    // rows are read on nearly every detail screen, so cache them for a while.
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<EntityMedia> => {
      const { data, error } = await supabase
        .from('entity_media')
        .select('id, slot, storage_path, bundled_key, alt, width, height, sort_order')
        .eq('entity_id', entityId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const media: EntityMedia = { hero: null, logo: null, gallery: [] };

      for (const row of data ?? []) {
        const bundled = artUrl(row.bundled_key);
        const src = row.storage_path ?? bundled;
        if (!src) continue;

        const picture: EntityPicture = {
          id: row.id,
          src,
          needsSigning: !!row.storage_path,
          alt: row.alt,
          width: row.width,
          height: row.height,
        };

        if (row.slot === 'hero') media.hero = picture;
        else if (row.slot === 'logo') media.logo = picture;
        else media.gallery.push(picture);
      }

      return media;
    },
  });
}

/** The value a caller gets before the query resolves, so no screen sees undefined. */
export const NO_ENTITY_MEDIA = EMPTY;
