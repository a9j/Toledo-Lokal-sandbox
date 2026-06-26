import { supabase } from '@/integrations/supabase/client';

// Convenience accessor for the Hire Local tables and RPCs. The migration has
// been applied and types.ts regenerated, so the tables ARE now in the generated
// Supabase types and `supabase.from('record_items')` typechecks directly. This
// stays as a thin, deliberately loose accessor so the hooks can read/write and
// map results into the hand-written interfaces in ./types without threading the
// full generated row/insert generics through every call. Hooks may migrate to
// the fully-typed client incrementally.

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
