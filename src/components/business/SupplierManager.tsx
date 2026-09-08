import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Handshake, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePostB2BRequest } from '@/hooks/useEconomy';

interface SupplierRow {
  id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  category: string | null;
  is_local: boolean;
  monthly_spend: number | null;
}

function useMySuppliers(businessId: string) {
  return useQuery({
    queryKey: ['my-suppliers', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_suppliers', { p_business_id: businessId });
      if (error) throw error;
      return (data ?? []) as SupplierRow[];
    },
  });
}

function useLocalSpendShare(businessId: string) {
  return useQuery({
    queryKey: ['local-spend-share', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_local_spend_share', {
        p_business_id: businessId,
      });
      if (error) throw error;
      return data as unknown as {
        local_monthly: number;
        total_monthly: number;
        local_share: number | null;
      };
    },
  });
}

/** Businesses to pick from when tagging a local supplier. */
function useBusinessSearch(query: string) {
  return useQuery({
    queryKey: ['business-search', query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('status', 'approved')
        .ilike('name', `%${query.trim()}%`)
        .limit(8);
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });
}

/**
 * Tag who you buy from, and say what you spend.
 *
 * Two different privacy levels on one screen, which the copy has to make
 * obvious: the supplier link is public, because the local chain is the point,
 * and the amount is private to this business. The database enforces that split
 * rather than this component: the link lives on a world readable table and the
 * amount lives on a self only one.
 */
export function SupplierManager({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const { data: suppliers, isLoading } = useMySuppliers(businessId);
  const { data: share } = useLocalSpendShare(businessId);
  const postRequest = usePostB2BRequest();

  const [search, setSearch] = useState('');
  const [outsideName, setOutsideName] = useState('');
  const [category, setCategory] = useState('');
  const { data: matches } = useBusinessSearch(search);

  const [askTitle, setAskTitle] = useState('');
  const [askBody, setAskBody] = useState('');
  const [isBarter, setIsBarter] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['my-suppliers', businessId] });
    queryClient.invalidateQueries({ queryKey: ['local-spend-share', businessId] });
    queryClient.invalidateQueries({ queryKey: ['economic-loop'] });
    queryClient.invalidateQueries({ queryKey: ['command-center', businessId] });
  };

  const addSupplier = useMutation({
    mutationFn: async (input: { supplierId?: string; supplierName?: string }) => {
      const { error } = await supabase.from('business_suppliers').insert({
        business_id: businessId,
        supplier_id: input.supplierId ?? null,
        supplier_name: input.supplierName ?? null,
        category: category.trim() || null,
        is_local: !!input.supplierId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSearch('');
      setOutsideName('');
      setCategory('');
      invalidate();
      toast.success('Added.');
    },
    onError: () => toast.error('Could not add that supplier.'),
  });

  const removeSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Removed.');
    },
    onError: () => toast.error('Could not remove that.'),
  });

  const setSpend = useMutation({
    mutationFn: async (input: { linkId: string; amount: number | null }) => {
      // Omitting the amount clears it: the database parameter defaults to
      // null, so "no figure recorded" is a first class state.
      const { error } = await supabase.rpc('set_supplier_spend', {
        p_link_id: input.linkId,
        p_monthly_spend: input.amount ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error('Could not save that amount.'),
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-base font-semibold">Who you buy from</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          The supplier is shown publicly on the local loop. What you pay is yours alone and
          nobody else can read it, staff included.
        </p>
      </div>

      {share && share.total_monthly > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-lg font-semibold leading-none tabular-nums">
              ${Math.round(share.local_monthly).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Stays in Toledo</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-lg font-semibold leading-none tabular-nums">
              ${Math.round(share.total_monthly).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">A month, total</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-lg font-semibold leading-none tabular-nums">
              {share.local_share === null ? 'n/a' : `${Math.round(share.local_share * 100)}%`}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Local share</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <div className="space-y-2">
          {(suppliers ?? []).map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium">{row.supplier_name ?? 'Unnamed'}</p>
                  {!row.is_local && (
                    <Badge variant="outline" className="text-[10px]">
                      Out of town
                    </Badge>
                  )}
                  {row.category && (
                    <span className="text-[11px] text-muted-foreground">{row.category}</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    defaultValue={row.monthly_spend ?? ''}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const amount = raw === '' ? null : Number(raw);
                      if (amount !== null && !Number.isFinite(amount)) {
                        toast.error('Use a number, or leave it blank.');
                        return;
                      }
                      if ((row.monthly_spend ?? null) === amount) return;
                      setSpend.mutate({ linkId: row.id, amount });
                    }}
                    placeholder="a month"
                    inputMode="decimal"
                    className="h-8 w-32 text-xs"
                    aria-label={`Monthly spend with ${row.supplier_name ?? 'this supplier'}`}
                  />
                  <span className="text-[11px] text-muted-foreground">private</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeSupplier.mutate(row.id)}
                disabled={removeSupplier.isPending}
                aria-label="Remove supplier"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {(suppliers ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nobody tagged yet.</p>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
        <h3 className="text-sm font-semibold">Add a supplier</h3>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Toledo businesses"
            className="pl-9"
            aria-label="Search local suppliers"
          />
        </div>
        {(matches ?? []).length > 0 && (
          <div className="space-y-1.5">
            {matches!.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => addSupplier.mutate({ supplierId: m.id })}
                disabled={addSupplier.isPending}
                className="flex w-full items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/40"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                {m.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={outsideName}
            onChange={(e) => setOutsideName(e.target.value)}
            placeholder="Or someone outside Toledo"
            aria-label="Supplier outside Toledo"
          />
          <Button
            variant="secondary"
            disabled={!outsideName.trim() || addSupplier.isPending}
            onClick={() => addSupplier.mutate({ supplierName: outsideName.trim() })}
          >
            Add
          </Button>
        </div>

        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="What they supply, optional"
          aria-label="Supply category"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Handshake className="h-4 w-4 text-muted-foreground" />
          Ask other businesses for something
        </h3>
        <p className="text-xs text-muted-foreground">
          This goes on the public board at the local loop.
        </p>
        <Input
          value={askTitle}
          onChange={(e) => setAskTitle(e.target.value)}
          placeholder="What you are looking for"
          aria-label="Request title"
        />
        <Textarea
          value={askBody}
          onChange={(e) => setAskBody(e.target.value)}
          placeholder="Any detail that helps someone answer"
          rows={3}
        />
        <div className="flex items-center gap-3">
          <Switch checked={isBarter} onCheckedChange={setIsBarter} id="barter" />
          <label htmlFor="barter" className="text-sm">
            A swap rather than cash
          </label>
        </div>
        <Button
          size="sm"
          disabled={!askTitle.trim() || postRequest.isPending}
          onClick={() =>
            postRequest.mutate(
              {
                businessId,
                title: askTitle.trim(),
                description: askBody.trim() || undefined,
                isBarter,
              },
              {
                onSuccess: () => {
                  setAskTitle('');
                  setAskBody('');
                  setIsBarter(false);
                  toast.success('Posted to the board.');
                },
                onError: (e: Error) => toast.error(e.message || 'Could not post that.'),
              },
            )
          }
        >
          {postRequest.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Post it
        </Button>
      </div>
    </section>
  );
}
