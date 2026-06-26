import { supabase } from '@/integrations/supabase/client';

// Untyped accessor for the Hire Local tables and RPCs, which are not yet in the
// generated Supabase types. Everything that touches these tables goes through
// `hl` and maps results into the interfaces in ./types, so the rest of the app
// keeps its full typing. Replace with the generated types after the migration
// is applied and `supabase gen types` is re-run.

type HlResult = { data: unknown; error: { message: string } | null };

interface HlQuery extends PromiseLike<HlResult> {
  select(cols?: string): HlQuery;
  insert(rows: unknown): HlQuery;
  update(vals: unknown): HlQuery;
  delete(): HlQuery;
  upsert(rows: unknown, opts?: unknown): HlQuery;
  eq(col: string, val: unknown): HlQuery;
  in(col: string, vals: unknown[]): HlQuery;
  gt(col: string, val: unknown): HlQuery;
  ilike(col: string, val: string): HlQuery;
  order(col: string, opts?: { ascending?: boolean }): HlQuery;
  limit(n: number): HlQuery;
  single(): Promise<HlResult>;
  maybeSingle(): Promise<HlResult>;
}

export const hl = supabase as unknown as {
  from(table: string): HlQuery;
  rpc(fn: string, args?: Record<string, unknown>): Promise<HlResult>;
};
