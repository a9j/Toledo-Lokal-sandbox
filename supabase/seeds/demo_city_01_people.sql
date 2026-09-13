-- Demo city, part 1: the residents who write things.
--
-- SANDBOX ONLY. Do not run against production.
--
-- Reviews, stories and neighbourly pulse posts all hang off a user id, so an
-- empty auth table means every business page shows "no reviews yet" and the
-- feed is a list of announcements with nobody in it. These ten accounts exist
-- so the demo has authors.
--
-- They are INVENTED. Nobody has these names, the addresses are on the reserved
-- .invalid domain so they can never reach a real inbox, and none of them has a
-- usable password: the rows carry no encrypted_password, so Supabase auth will
-- refuse every sign in attempt. They are content authors and nothing else.
--
-- To remove them: delete from auth.users where email like '%@demo.toledolokal.invalid';
-- Everything they wrote is removed with them by the existing cascades.

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
                        created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
select v.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       v.email, now() - interval '120 days',
       now() - (v.age || ' days')::interval, now() - (v.age || ' days')::interval,
       jsonb_build_object('provider', 'demo', 'providers', array['demo']),
       jsonb_build_object('name', v.name, 'demo_seed', true)
from (values
  ('de300001-0000-4000-8000-000000000001'::uuid, 'rosa.delgado@demo.toledolokal.invalid',   'Rosa Delgado',    210),
  ('de300001-0000-4000-8000-000000000002'::uuid, 'marcus.bell@demo.toledolokal.invalid',    'Marcus Bell',     198),
  ('de300001-0000-4000-8000-000000000003'::uuid, 'hannah.pham@demo.toledolokal.invalid',    'Hannah Pham',     186),
  ('de300001-0000-4000-8000-000000000004'::uuid, 'dwayne.oketch@demo.toledolokal.invalid',  'Dwayne Oketch',   171),
  ('de300001-0000-4000-8000-000000000005'::uuid, 'sofia.kowalski@demo.toledolokal.invalid', 'Sofia Kowalski',  160),
  ('de300001-0000-4000-8000-000000000006'::uuid, 'terrence.hobbs@demo.toledolokal.invalid', 'Terrence Hobbs',  148),
  ('de300001-0000-4000-8000-000000000007'::uuid, 'amira.saleh@demo.toledolokal.invalid',    'Amira Saleh',     132),
  ('de300001-0000-4000-8000-000000000008'::uuid, 'grant.mueller@demo.toledolokal.invalid',  'Grant Mueller',   119),
  ('de300001-0000-4000-8000-000000000009'::uuid, 'kayla.brightwater@demo.toledolokal.invalid', 'Kayla Brightwater', 96),
  ('de300001-0000-4000-8000-000000000010'::uuid, 'ellis.vance@demo.toledolokal.invalid',    'Ellis Vance',      74)
) as v(id, email, name, age)
where not exists (select 1 from auth.users u where u.id = v.id);

-- handle_new_user() already made a profile for each. Fill in the rest of it:
-- an avatar, a home neighbourhood, and the two flags that stop the app pushing
-- them into onboarding.
update public.profiles p
set avatar_url = v.avatar,
    neighborhood_id = (select id from public.neighborhoods where name = v.hood),
    role_selected = true,
    profile_completed = true,
    -- favorite_categories holds category ids, so the readable slugs above are
    -- resolved here rather than pasted in as uuids.
    favorite_categories = array(select c.id from public.categories c where c.slug = any(v.faves))
from (values
  ('de300001-0000-4000-8000-000000000001'::uuid, '/art/avatar-01.svg', 'Old West End',  array['food-drink','arts-nightlife']),
  ('de300001-0000-4000-8000-000000000002'::uuid, '/art/avatar-02.svg', 'Downtown',      array['food-drink','events']),
  ('de300001-0000-4000-8000-000000000003'::uuid, '/art/avatar-03.svg', 'East Toledo',   array['outdoors-recreation','family-kids']),
  ('de300001-0000-4000-8000-000000000004'::uuid, '/art/avatar-04.svg', 'South Toledo',  array['local-services','jobs-opportunities']),
  ('de300001-0000-4000-8000-000000000005'::uuid, '/art/avatar-05.svg', 'West Toledo',   array['shopping','health-wellness']),
  ('de300001-0000-4000-8000-000000000006'::uuid, '/art/avatar-06.svg', 'Downtown',      array['arts-nightlife','events']),
  ('de300001-0000-4000-8000-000000000007'::uuid, '/art/avatar-07.svg', 'Sylvania',      array['family-kids','education-classes']),
  ('de300001-0000-4000-8000-000000000008'::uuid, '/art/avatar-08.svg', 'Perrysburg',    array['home-services','outdoors-recreation']),
  ('de300001-0000-4000-8000-000000000009'::uuid, '/art/avatar-01.svg', 'Maumee',        array['food-drink','shopping']),
  ('de300001-0000-4000-8000-000000000010'::uuid, '/art/avatar-04.svg', 'Old West End',  array['nonprofits-community','arts-nightlife'])
) as v(user_id, avatar, hood, faves)
where p.user_id = v.user_id;

-- Residents, so the app treats them as signed up people rather than as
-- accounts waiting on approval.
insert into public.user_roles (user_id, role)
select u.id, 'resident'::public.app_role
from auth.users u
where u.email like '%@demo.toledolokal.invalid'
  and not exists (
    select 1 from public.user_roles r where r.user_id = u.id and r.role = 'resident'::public.app_role
  );
