import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DataSourceKind = 'api' | 'gis' | 'rss' | 'ical' | 'csv' | 'manual';

export interface DataSource {
  id: string;
  name: string;
  kind: DataSourceKind;
  url: string | null;
  schedule: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  record_count: number;
  is_active: boolean;
}

export interface EntityProvenance {
  source_name: string | null;
  source_kind: string | null;
  confidence: number | null;
  fetched_at: string | null;
  verified_at: string | null;
  last_run_at: string | null;
  is_seed: boolean | null;
}

/** Every source, newest run first. Readable by anyone: where a fact came from
 *  is part of the fact. Credentials live in data_source_config, which is not
 *  readable here and is never selected. */
export function useDataSources() {
  return useQuery({
    queryKey: ['data-sources'],
    queryFn: async (): Promise<DataSource[]> => {
      const { data, error } = await supabase
        .from('data_sources')
        .select('id, name, kind, url, schedule, last_run_at, last_status, last_error, record_count, is_active')
        .order('is_active', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data ?? []) as DataSource[];
    },
  });
}

/** How many records a source has brought in, and when it last did. */
export function useSourceRecordCounts() {
  return useQuery({
    queryKey: ['source-record-counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('source_records')
        .select('source_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const id = (row as { source_id: string }).source_id;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    },
  });
}

/** Run one connector now. The edge function checks that the caller is an
 *  admin; the button being hidden is not the control. */
export function useRunConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke('connectors-run', {
        body: { source_id: sourceId },
      });
      if (error) throw error;
      return data as { ok?: boolean; status?: string; records?: number; message?: string; error?: string };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['source-record-counts'] });
    },
  });
}

/** Where one entity came from. Drives the confidence badge. */
export function useEntityProvenance(entityId: string | null | undefined) {
  return useQuery({
    queryKey: ['entity-provenance', entityId],
    enabled: !!entityId,
    queryFn: async (): Promise<EntityProvenance | null> => {
      const { data, error } = await supabase.rpc('entity_provenance', {
        p_entity_id: entityId as string,
      });
      if (error) throw error;
      const rows = (data ?? []) as EntityProvenance[];
      return rows[0] ?? null;
    },
  });
}

/** Plain words for a status the connector wrote. */
export function statusLabel(status: string | null): string {
  switch (status) {
    case 'ok': return 'Worked';
    case 'failed': return 'Failed';
    case 'needs url': return 'Needs a link';
    case 'bad url': return 'That link will not work';
    case 'not implemented': return 'Not built yet';
    case 'empty': return 'Nothing in it';
    case 'not a real source': return 'Made up data';
    case null: case undefined: return 'Never run';
    default: return status;
  }
}
