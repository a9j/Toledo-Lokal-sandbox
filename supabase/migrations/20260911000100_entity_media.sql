-- Images for every kind of thing in the city.
--
-- Before this, images lived in two places and neither covered the city. Every
-- entity table carried its own text column (cover_image_url, logo_url,
-- image_url, photo_url), and media_assets held structured rows but only for
-- businesses: its business_id is NOT NULL, so it cannot describe a
-- neighborhood, a parcel or a job.
--
-- This keys media to city_entities instead. The registry already unifies all
-- 16 kinds, so one table gives images to neighborhoods, parcels, issues,
-- opportunities and jobs at once, and to whatever kind comes next without
-- another migration.
--
-- Nothing is dropped, renamed or altered. media_assets is left exactly as it
-- is, and the existing *_url columns keep working. This is additive.
--
-- A row points at one of two sources:
--   storage_path  a real upload in Supabase storage
--   bundled_key   a placeholder committed to the repo under src/assets
-- Exactly one is required. The bundled art is what makes the sandbox look
-- composed while it holds no real photographs.

create table if not exists public.entity_media (
  id           uuid primary key default gen_random_uuid(),
  entity_id    uuid not null references public.city_entities(id) on delete cascade,
  slot         text not null default 'gallery',
  storage_path text,
  bundled_key  text,
  alt          text,
  width        integer,
  height       integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint entity_media_slot_valid
    check (slot in ('hero', 'gallery', 'logo')),
  constraint entity_media_has_source
    check (storage_path is not null or bundled_key is not null)
);

comment on table public.entity_media is
  'Images for any city_entities row. Additive to media_assets, which stays business only.';
comment on column public.entity_media.bundled_key is
  'Key into the placeholder art committed under src/assets. Null once a real photo replaces it.';

-- One hero per entity. A second hero is a mistake, not a choice, so the
-- database refuses it rather than letting the page pick one at random.
create unique index if not exists entity_media_one_hero
  on public.entity_media (entity_id) where slot = 'hero';

create unique index if not exists entity_media_one_logo
  on public.entity_media (entity_id) where slot = 'logo';

create index if not exists entity_media_lookup
  on public.entity_media (entity_id, slot, sort_order);

-- One to six photos in a gallery. Six is the cap the swipeable gallery is
-- designed for, and enforcing it here means no screen has to cope with a
-- seventh.
create or replace function public.entity_media_gallery_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing integer;
begin
  if new.slot <> 'gallery' then
    return new;
  end if;

  select count(*) into existing
  from public.entity_media
  where entity_id = new.entity_id
    and slot = 'gallery'
    and (tg_op = 'INSERT' or id <> new.id);

  if existing >= 6 then
    raise exception 'entity % already has 6 gallery photos, which is the limit', new.entity_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists entity_media_gallery_cap_trg on public.entity_media;
create trigger entity_media_gallery_cap_trg
  before insert or update on public.entity_media
  for each row execute function public.entity_media_gallery_cap();

-- Keep updated_at honest.
create or replace function public.entity_media_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entity_media_touch_trg on public.entity_media;
create trigger entity_media_touch_trg
  before update on public.entity_media
  for each row execute function public.entity_media_touch();

alter table public.entity_media enable row level security;

-- Anyone can look at the city. Only an admin changes what it looks like.
drop policy if exists entity_media_read on public.entity_media;
create policy entity_media_read on public.entity_media
  for select using (true);

drop policy if exists entity_media_write on public.entity_media;
create policy entity_media_write on public.entity_media
  for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- The trigger body is reachable over PostgREST unless it is revoked, and it is
-- SECURITY DEFINER, so revoke it the way every other definer function in this
-- schema is revoked.
revoke all on function public.entity_media_gallery_cap() from public, anon, authenticated;
revoke all on function public.entity_media_touch() from public, anon, authenticated;
