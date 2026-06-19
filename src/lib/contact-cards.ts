import { supabase } from '@/integrations/supabase/client';

// Per-person contact cards. A card holds the title a person picks for a business
// plus a snapshot of their account name and email, so a shared QR saves the
// contact under that individual. The table is not yet in the generated Supabase
// types, so the calls below cast through `never` until types are regenerated.

export interface PublicContactCard {
  name: string | null;
  title: string | null;
  email: string | null;
}

// Create or refresh the current user's card for a business, keeping any title
// they already set. Returns the card id and current title, or null on failure
// (e.g. the user is not the owner or staff of the business).
export async function ensureContactCard(
  businessId: string,
  userId: string,
  name: string | null,
  email: string | null,
): Promise<{ id: string; title: string | null; name: string | null } | null> {
  // Look for an existing card first so we never clobber a name/title the person
  // customized for this business. Only the email snapshot is refreshed; the
  // snapshot name is used solely to seed a brand-new card.
  const { data: existing } = await supabase
    .from('business_contact_cards' as never)
    .select('id, title, name')
    .eq('business_id' as never, businessId as never)
    .eq('user_id' as never, userId as never)
    .maybeSingle();

  if (existing) {
    const row = existing as unknown as { id: string; title: string | null; name: string | null };
    await supabase
      .from('business_contact_cards' as never)
      .update({ email } as never)
      .eq('id' as never, row.id as never);
    return row;
  }

  const { data, error } = await supabase
    .from('business_contact_cards' as never)
    .insert({ business_id: businessId, user_id: userId, name, email } as never)
    .select('id, title, name')
    .single();
  if (error || !data) return null;
  return data as unknown as { id: string; title: string | null; name: string | null };
}

export async function updateContactTitle(cardId: string, title: string): Promise<void> {
  await supabase
    .from('business_contact_cards' as never)
    .update({ title: title.trim() || null } as never)
    .eq('id' as never, cardId as never);
}

export async function updateContactName(cardId: string, name: string): Promise<void> {
  await supabase
    .from('business_contact_cards' as never)
    .update({ name: name.trim() || null } as never)
    .eq('id' as never, cardId as never);
}

// Public, no-account read of a single card via the SECURITY DEFINER function.
export async function fetchPublicContactCard(cardId: string): Promise<PublicContactCard | null> {
  const { data, error } = await supabase.rpc('get_contact_card' as never, { p_card_id: cardId } as never);
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as PublicContactCard | null;
}
