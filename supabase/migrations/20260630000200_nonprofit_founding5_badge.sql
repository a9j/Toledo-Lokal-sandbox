-- Award founding5_nonprofit profile badge to users who claimed a founding nonprofit.
-- Mirrors the charter100 badge pattern: world-readable, permanent, platform-wide.

insert into public.profile_badges (profile_id, badge_key)
select p.id, 'founding5_nonprofit'
from public.nonprofits n
join public.profiles p on p.user_id = n.claimed_by
where n.founding_community_partner = true
  and n.claimed_by is not null
on conflict (profile_id, badge_key) do nothing;

-- Auto-award when a nonprofit is first marked as founding (future-proofing).
create or replace function public.auto_award_founding_nonprofit_badge()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.founding_community_partner = true and new.claimed_by is not null then
    insert into public.profile_badges (profile_id, badge_key)
    select p.id, 'founding5_nonprofit'
    from public.profiles p
    where p.user_id = new.claimed_by
    on conflict (profile_id, badge_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_award_founding_nonprofit_badge
  after insert or update of founding_community_partner, claimed_by
  on public.nonprofits
  for each row
  execute function public.auto_award_founding_nonprofit_badge();
