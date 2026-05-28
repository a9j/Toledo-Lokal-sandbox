-- Pulse restructure: "the heartbeat of the city".
--
-- Reshapes Pulse around four structured content types (business activity,
-- community activity, local moments, live city signals) instead of a generic
-- feed. Adds lightweight positive reactions, a report/moderation pipeline, a
-- non-AI trust system, and system-generated activity signals computed from real
-- platform activity (saves, posts, rewards, events) — no AI generation anywhere.

-- ---------------------------------------------------------------------------
-- 1. Extend pulse_posts with structured-content fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.pulse_posts
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'business_activity'
    CHECK (content_type IN ('business_activity', 'community_activity', 'local_moment', 'city_signal')),
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS why_it_matters text,
  ADD COLUMN IF NOT EXISTS place_business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_data jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reaction_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reaction_counts jsonb NOT NULL DEFAULT '{}';

-- Backfill content_type from the legacy category for existing rows.
UPDATE public.pulse_posts SET content_type = CASE
  WHEN category = 'community_ask' THEN 'community_activity'
  WHEN category = 'good_stuff'    THEN 'local_moment'
  WHEN category = 'energy_check'  THEN 'city_signal'
  ELSE 'business_activity'
END
WHERE content_type = 'business_activity' AND category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pulse_posts_content_type ON public.pulse_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_pulse_posts_neighborhood ON public.pulse_posts(neighborhood);
CREATE INDEX IF NOT EXISTS idx_pulse_posts_tags ON public.pulse_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_pulse_posts_reaction_count ON public.pulse_posts(reaction_count DESC);

-- ---------------------------------------------------------------------------
-- 2. pulse_post_templates — the only way to post (structured posting)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pulse_post_templates (
  key text PRIMARY KEY,
  content_type text NOT NULL
    CHECK (content_type IN ('business_activity', 'community_activity', 'local_moment', 'city_signal')),
  label text NOT NULL,
  description text,
  icon text,
  prompt text,
  default_expiration_hours integer NOT NULL DEFAULT 24,
  max_expiration_hours integer NOT NULL DEFAULT 48,
  allowed_authors text[] NOT NULL DEFAULT '{user,business,nonprofit}',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

INSERT INTO public.pulse_post_templates (key, content_type, label, description, icon, prompt, default_expiration_hours, max_expiration_hours, allowed_authors, sort_order) VALUES
  -- Business activity
  ('todays_special',  'business_activity', 'Today''s special',     'A dish, drink, or item available today',        'Sparkles',   'What''s special today?',               24, 24, '{business}', 10),
  ('flash_reward',    'business_activity', 'Flash reward',         'A limited-time Loop reward or bonus',           'Zap',        'What reward is live right now?',        4,  8,  '{business}', 20),
  ('business_event',  'business_activity', 'Event',                'Something happening at your business',           'CalendarDays','What''s the event?',                   48, 72, '{business}', 30),
  ('new_arrival',     'business_activity', 'New arrival',          'Something new in stock or on the menu',          'PackagePlus','What just arrived?',                    24, 48, '{business}', 40),
  ('hiring',          'business_activity', 'Hiring',               'An open role at your business',                  'Briefcase',  'What role are you hiring for?',         48, 72, '{business}', 50),
  ('staff_spotlight', 'business_activity', 'Staff spotlight',      'Celebrate someone on your team',                 'UserStar',   'Who are you spotlighting?',             24, 48, '{business}', 60),
  ('live_music',      'business_activity', 'Live music',           'Live music happening tonight',                   'Music',      'Who''s playing and when?',              8,  12, '{business}', 70),
  ('availability',    'business_activity', 'Availability update',  'Open slots, tables, or appointments',            'Clock',      'What''s available right now?',          6,  12, '{business}', 80),
  ('community_support','business_activity','Community support',    'A cause or fundraiser you''re backing',          'HeartHandshake','Who are you supporting?',            48, 72, '{business}', 90),
  ('holiday_update',  'business_activity', 'Holiday update',       'Holiday hours or closures',                      'PartyPopper','What''s changing for the holiday?',     72, 168,'{business}', 100),
  ('schedule_update', 'business_activity', 'Schedule update',      'A change to your normal hours',                  'CalendarClock','What''s the schedule change?',        24, 48, '{business}', 110),
  ('limited_offer',   'business_activity', 'Limited-time offer',   'A short-lived offer for locals',                 'Tag',        'What''s the offer and when does it end?',12, 24, '{business}', 120),
  -- Community activity
  ('volunteer_need',  'community_activity','Volunteer need',       'Recruit volunteers for a need',                  'Users',      'What help do you need and when?',       72, 168,'{nonprofit,business,user}', 200),
  ('donation_drive',  'community_activity','Donation drive',       'Collect donations for a cause',                  'Gift',       'What are you collecting?',              168,336,'{nonprofit,business,user}', 210),
  ('community_event', 'community_activity','Community event',      'A free or open community gathering',             'CalendarHeart','What''s the event?',                  72, 168,'{nonprofit,business,user}', 220),
  ('cleanup_effort',  'community_activity','Cleanup effort',       'A neighborhood cleanup or beautification',       'Trash2',     'Where and when is the cleanup?',        72, 168,'{nonprofit,business,user}', 230),
  ('mutual_aid',      'community_activity','Mutual aid',           'Neighbors helping neighbors',                    'HandHeart',  'What support is being offered or needed?',72,168,'{nonprofit,business,user}', 240),
  ('youth_program',   'community_activity','Youth program',        'A program for kids or teens',                    'GraduationCap','What''s the program?',                168,336,'{nonprofit,business,user}', 250),
  ('public_resource', 'community_activity','Public resource',      'A free resource locals should know about',       'BookOpen',   'What''s the resource?',                 168,336,'{nonprofit,business,user}', 260),
  ('community_class', 'community_activity','Community class',      'A class open to the community',                  'Presentation','What''s the class?',                   72, 168,'{nonprofit,business,user}', 270),
  ('school_support',  'community_activity','School support',       'Support a local school',                         'School',     'How can locals help the school?',       168,336,'{nonprofit,business,user}', 280),
  ('fundraiser',      'community_activity','Fundraiser',           'Raise funds for a cause',                        'PiggyBank',  'What are you raising funds for?',       336,720,'{nonprofit,business,user}', 290),
  -- Local moments (residents)
  ('local_moment',    'local_moment',     'Local moment',         'A short, positive memory tied to a place',       'Sparkle',    'What made this place special?',         24, 48, '{user}', 300),
  ('check_in',        'local_moment',     'Check-in',             'You''re here right now',                          'MapPin',     'Where are you?',                        6,  12, '{user}', 310),
  ('recommendation',  'local_moment',     'Recommendation',       'A place worth telling neighbors about',          'ThumbsUp',   'What do you recommend and why?',        48, 72, '{user}', 320)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. pulse_reactions — lightweight, positive-only reactions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pulse_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL
    CHECK (reaction_type IN ('love', 'trending', 'want_to_go', 'community_favorite', 'looks_fun', 'my_list')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_pulse_reactions_post ON public.pulse_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_pulse_reactions_user ON public.pulse_reactions(user_id);

-- Maintain reaction_count + per-type reaction_counts on the parent post.
CREATE OR REPLACE FUNCTION public.pulse_recount_reactions(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pulse_posts p SET
    reaction_count = COALESCE(agg.total, 0),
    reaction_counts = COALESCE(agg.by_type, '{}'::jsonb)
  FROM (
    SELECT
      COUNT(*)::int AS total,
      jsonb_object_agg(reaction_type, cnt) AS by_type
    FROM (
      SELECT reaction_type, COUNT(*)::int AS cnt
      FROM public.pulse_reactions
      WHERE post_id = p_post_id
      GROUP BY reaction_type
    ) t
  ) agg
  WHERE p.id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.pulse_reactions_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.pulse_recount_reactions(COALESCE(NEW.post_id, OLD.post_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_pulse_reactions_change ON public.pulse_reactions;
CREATE TRIGGER trg_pulse_reactions_change
  AFTER INSERT OR DELETE ON public.pulse_reactions
  FOR EACH ROW EXECUTE FUNCTION public.pulse_reactions_after_change();

-- ---------------------------------------------------------------------------
-- 4. pulse_reports — report button + moderation queue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pulse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL
    CHECK (reason IN ('spam', 'not_local', 'inappropriate', 'harassment', 'misleading', 'duplicate', 'other')),
  note text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  moderator_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_pulse_reports_status ON public.pulse_reports(status);
CREATE INDEX IF NOT EXISTS idx_pulse_reports_post ON public.pulse_reports(post_id);

-- Auto-hide a post once it accumulates enough distinct reports.
CREATE OR REPLACE FUNCTION public.pulse_reports_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_total integer;
BEGIN
  SELECT COUNT(*) INTO report_total
  FROM public.pulse_reports
  WHERE post_id = NEW.post_id AND status = 'pending';

  UPDATE public.pulse_posts
    SET flag_count = report_total
    WHERE id = NEW.post_id;

  IF report_total >= 4 THEN
    UPDATE public.pulse_posts
      SET status = 'hidden'
      WHERE id = NEW.post_id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pulse_reports_insert ON public.pulse_reports;
CREATE TRIGGER trg_pulse_reports_insert
  AFTER INSERT ON public.pulse_reports
  FOR EACH ROW EXECUTE FUNCTION public.pulse_reports_after_insert();

-- ---------------------------------------------------------------------------
-- 5. pulse_trust_scores — non-AI trust system
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pulse_trust_scores (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'new'
    CHECK (level IN ('new', 'local', 'trusted', 'ambassador')),
  checkins integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  posts integer NOT NULL DEFAULT 0,
  account_age_days integer NOT NULL DEFAULT 0,
  profile_complete boolean NOT NULL DEFAULT false,
  reports_against integer NOT NULL DEFAULT 0,
  is_business_owner boolean NOT NULL DEFAULT false,
  is_ambassador boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recompute a user's trust score from real activity. Pure aggregation; no AI.
CREATE OR REPLACE FUNCTION public.recompute_pulse_trust(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checkins integer := 0;
  v_saves integer := 0;
  v_posts integer := 0;
  v_age_days integer := 0;
  v_profile_complete boolean := false;
  v_reports integer := 0;
  v_is_business boolean := false;
  v_is_ambassador boolean := false;
  v_score integer := 0;
  v_level text := 'new';
BEGIN
  SELECT COUNT(*) INTO v_checkins
    FROM public.pulse_posts
    WHERE user_id = p_user_id AND template_key = 'check_in';

  SELECT COUNT(*) INTO v_saves
    FROM public.saved_items WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_posts
    FROM public.pulse_posts WHERE user_id = p_user_id;

  SELECT GREATEST(0, EXTRACT(DAY FROM now() - MIN(created_at))::int)
    INTO v_age_days
    FROM public.profiles WHERE user_id = p_user_id;

  SELECT (name IS NOT NULL AND neighborhood_id IS NOT NULL)
    INTO v_profile_complete
    FROM public.profiles WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_reports
    FROM public.pulse_reports r
    JOIN public.pulse_posts p ON p.id = r.post_id
    WHERE p.user_id = p_user_id AND r.status IN ('pending', 'actioned');

  SELECT EXISTS(
    SELECT 1 FROM public.businesses
    WHERE owner_user_id = p_user_id AND status = 'approved'
  ) INTO v_is_business;

  SELECT public.has_role(p_user_id, 'ambassador') INTO v_is_ambassador;

  v_score :=
      LEAST(v_checkins, 50) * 3
    + LEAST(v_saves, 50) * 1
    + LEAST(v_posts, 50) * 1
    + LEAST(v_age_days, 365) / 30 * 5
    + (CASE WHEN COALESCE(v_profile_complete, false) THEN 15 ELSE 0 END)
    + (CASE WHEN v_is_business THEN 20 ELSE 0 END)
    + (CASE WHEN v_is_ambassador THEN 100 ELSE 0 END)
    - (v_reports * 10);

  v_score := GREATEST(v_score, 0);

  v_level := CASE
    WHEN v_is_ambassador OR v_score >= 200 THEN 'ambassador'
    WHEN v_score >= 80 THEN 'trusted'
    WHEN v_score >= 25 THEN 'local'
    ELSE 'new'
  END;

  INSERT INTO public.pulse_trust_scores
    (user_id, score, level, checkins, saves, posts, account_age_days,
     profile_complete, reports_against, is_business_owner, is_ambassador, updated_at)
  VALUES
    (p_user_id, v_score, v_level, v_checkins, v_saves, v_posts, COALESCE(v_age_days, 0),
     COALESCE(v_profile_complete, false), v_reports, v_is_business, COALESCE(v_is_ambassador, false), now())
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    level = EXCLUDED.level,
    checkins = EXCLUDED.checkins,
    saves = EXCLUDED.saves,
    posts = EXCLUDED.posts,
    account_age_days = EXCLUDED.account_age_days,
    profile_complete = EXCLUDED.profile_complete,
    reports_against = EXCLUDED.reports_against,
    is_business_owner = EXCLUDED.is_business_owner,
    is_ambassador = EXCLUDED.is_ambassador,
    updated_at = now();
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. neighborhood_activity — the city-energy layer (system generated)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.neighborhood_activity (
  neighborhood text PRIMARY KEY,
  activity_score numeric NOT NULL DEFAULT 0,
  energy_level text NOT NULL DEFAULT 'calm'
    CHECK (energy_level IN ('quiet', 'calm', 'steady', 'active', 'buzzing')),
  energy_emoji text NOT NULL DEFAULT '🌙',
  label text,
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- Rebuild neighborhood energy from real activity in a recent window.
CREATE OR REPLACE FUNCTION public.compute_neighborhood_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  v_max numeric := 1;
  v_norm numeric;
  v_level text;
  v_emoji text;
BEGIN
  CREATE TEMP TABLE _hood_scores ON COMMIT DROP AS
  SELECT n.name AS neighborhood,
         COALESCE(posts.cnt, 0) * 2
       + COALESCE(saves.cnt, 0)
       + COALESCE(reactions.cnt, 0) AS activity_score
  FROM public.neighborhoods n
  LEFT JOIN (
    SELECT neighborhood, COUNT(*) AS cnt
    FROM public.pulse_posts
    WHERE created_at > now() - interval '24 hours'
      AND neighborhood IS NOT NULL
    GROUP BY neighborhood
  ) posts ON posts.neighborhood = n.name
  LEFT JOIN (
    SELECT b.neighborhood_id, COUNT(*) AS cnt
    FROM public.saved_items s
    JOIN public.businesses b ON b.id = s.item_id AND s.item_type = 'business'
    WHERE s.created_at > now() - interval '24 hours'
    GROUP BY b.neighborhood_id
  ) saves ON saves.neighborhood_id = n.id
  LEFT JOIN (
    SELECT p.neighborhood, COUNT(*) AS cnt
    FROM public.pulse_reactions r
    JOIN public.pulse_posts p ON p.id = r.post_id
    WHERE r.created_at > now() - interval '24 hours'
      AND p.neighborhood IS NOT NULL
    GROUP BY p.neighborhood
  ) reactions ON reactions.neighborhood = n.name;

  SELECT GREATEST(MAX(activity_score), 1) INTO v_max FROM _hood_scores;

  FOR rec IN SELECT neighborhood, activity_score FROM _hood_scores LOOP
    v_norm := rec.activity_score / v_max;
    IF rec.activity_score = 0 THEN
      v_level := 'quiet'; v_emoji := '🌙';
    ELSIF v_norm < 0.25 THEN
      v_level := 'calm'; v_emoji := '☕';
    ELSIF v_norm < 0.5 THEN
      v_level := 'steady'; v_emoji := '✨';
    ELSIF v_norm < 0.8 THEN
      v_level := 'active'; v_emoji := '🔥';
    ELSE
      v_level := 'buzzing'; v_emoji := '⚡';
    END IF;

    INSERT INTO public.neighborhood_activity
      (neighborhood, activity_score, energy_level, energy_emoji, label, computed_at)
    VALUES (rec.neighborhood, rec.activity_score, v_level, v_emoji,
            initcap(v_level) || ' right now', now())
    ON CONFLICT (neighborhood) DO UPDATE SET
      activity_score = EXCLUDED.activity_score,
      energy_level = EXCLUDED.energy_level,
      energy_emoji = EXCLUDED.energy_emoji,
      label = EXCLUDED.label,
      computed_at = now();
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. city_signals — Live City Signals, derived from real activity (no AI)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.city_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text NOT NULL,
  title text NOT NULL,
  subtitle text,
  neighborhood text,
  category text,
  metric numeric,
  reference_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_signals_valid ON public.city_signals(valid_until DESC);

-- Regenerate city signals from real platform activity. Each signal is a fact
-- computed from aggregates (saves, posts, events, neighborhood energy).
CREATE OR REPLACE FUNCTION public.generate_city_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_top_hood text;
  v_top_hood_emoji text;
  v_saved_biz record;
  v_event_count integer;
BEGIN
  -- Clear the active window so signals always reflect "right now".
  DELETE FROM public.city_signals WHERE valid_until < now() - interval '1 hour';
  DELETE FROM public.city_signals WHERE signal_type IN
    ('top_neighborhood', 'most_saved', 'events_tonight', 'community_rising', 'neighborhood_energy');

  -- Most active neighborhood today.
  SELECT neighborhood, energy_emoji INTO v_top_hood, v_top_hood_emoji
  FROM public.neighborhood_activity
  WHERE activity_score > 0
  ORDER BY activity_score DESC
  LIMIT 1;

  IF v_top_hood IS NOT NULL THEN
    INSERT INTO public.city_signals (signal_type, title, subtitle, neighborhood)
    VALUES ('top_neighborhood',
            v_top_hood_emoji || ' ' || v_top_hood || ' is the most active area today',
            'Based on local posts, saves, and reactions',
            v_top_hood);
  END IF;

  -- Most-saved business this week.
  SELECT b.id AS business_id, b.name, n.name AS hood, COUNT(*) AS cnt
  INTO v_saved_biz
  FROM public.saved_items s
  JOIN public.businesses b ON b.id = s.item_id AND s.item_type = 'business'
  LEFT JOIN public.neighborhoods n ON n.id = b.neighborhood_id
  WHERE s.created_at > now() - interval '7 days'
  GROUP BY b.id, b.name, n.name
  ORDER BY cnt DESC
  LIMIT 1;

  IF v_saved_biz.business_id IS NOT NULL THEN
    INSERT INTO public.city_signals (signal_type, title, subtitle, neighborhood, reference_id, metric)
    VALUES ('most_saved',
            '⭐ ' || v_saved_biz.name || ' is the most-saved spot this week',
            COALESCE(v_saved_biz.hood, 'Toledo') || ' • ' || v_saved_biz.cnt || ' new saves',
            v_saved_biz.hood, v_saved_biz.business_id, v_saved_biz.cnt);
  END IF;

  -- Events happening soon.
  SELECT COUNT(*) INTO v_event_count
  FROM public.events
  WHERE status = 'approved'
    AND start_date_time BETWEEN now() AND now() + interval '24 hours';

  IF v_event_count > 0 THEN
    INSERT INTO public.city_signals (signal_type, title, subtitle, metric)
    VALUES ('events_tonight',
            '🎉 ' || v_event_count || ' event' || (CASE WHEN v_event_count = 1 THEN '' ELSE 's' END) || ' happening in the next 24 hours',
            'Tap Events to see what''s on',
            v_event_count);
  END IF;

  -- Community activity rising (community posts in last 48h).
  SELECT COUNT(*) INTO v_event_count
  FROM public.pulse_posts
  WHERE content_type = 'community_activity'
    AND status = 'active'
    AND created_at > now() - interval '48 hours';

  IF v_event_count >= 2 THEN
    INSERT INTO public.city_signals (signal_type, title, subtitle, metric)
    VALUES ('community_rising',
            '🙌 Community activity is rising',
            v_event_count || ' new volunteer & community posts this week',
            v_event_count);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.pulse_post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_signals ENABLE ROW LEVEL SECURITY;

-- Templates: public read; admins manage.
DROP POLICY IF EXISTS "Anyone can view templates" ON public.pulse_post_templates;
CREATE POLICY "Anyone can view templates" ON public.pulse_post_templates
  FOR SELECT USING (active = true OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins manage templates" ON public.pulse_post_templates;
CREATE POLICY "Admins manage templates" ON public.pulse_post_templates
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Reactions: public read (aggregates), users manage their own.
DROP POLICY IF EXISTS "Anyone can view pulse reactions" ON public.pulse_reactions;
CREATE POLICY "Anyone can view pulse reactions" ON public.pulse_reactions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users add own pulse reactions" ON public.pulse_reactions;
CREATE POLICY "Users add own pulse reactions" ON public.pulse_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users remove own pulse reactions" ON public.pulse_reactions;
CREATE POLICY "Users remove own pulse reactions" ON public.pulse_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reports: reporters create + see their own; moderators see/manage all.
DROP POLICY IF EXISTS "Users create reports" ON public.pulse_reports;
CREATE POLICY "Users create reports" ON public.pulse_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Users view own reports" ON public.pulse_reports;
CREATE POLICY "Users view own reports" ON public.pulse_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.can_moderate(auth.uid()));
DROP POLICY IF EXISTS "Moderators manage reports" ON public.pulse_reports;
CREATE POLICY "Moderators manage reports" ON public.pulse_reports
  FOR UPDATE TO authenticated
  USING (public.can_moderate(auth.uid()))
  WITH CHECK (public.can_moderate(auth.uid()));

-- Trust scores: users read their own; moderators read all; system writes.
DROP POLICY IF EXISTS "Users view own trust" ON public.pulse_trust_scores;
CREATE POLICY "Users view own trust" ON public.pulse_trust_scores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.can_moderate(auth.uid()));
DROP POLICY IF EXISTS "Admins manage trust" ON public.pulse_trust_scores;
CREATE POLICY "Admins manage trust" ON public.pulse_trust_scores
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Neighborhood activity + city signals: public read; admins manage.
DROP POLICY IF EXISTS "Anyone can view neighborhood activity" ON public.neighborhood_activity;
CREATE POLICY "Anyone can view neighborhood activity" ON public.neighborhood_activity
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage neighborhood activity" ON public.neighborhood_activity;
CREATE POLICY "Admins manage neighborhood activity" ON public.neighborhood_activity
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view city signals" ON public.city_signals;
CREATE POLICY "Anyone can view city signals" ON public.city_signals
  FOR SELECT USING (valid_until > now() OR public.is_platform_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins manage city signals" ON public.city_signals;
CREATE POLICY "Admins manage city signals" ON public.city_signals
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 9. Realtime + seed initial energy so Pulse never feels dead
-- ---------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.neighborhood_activity;

-- Seed a baseline energy row for the core neighborhoods so the city-energy
-- layer renders immediately, before the first scheduled compute runs.
INSERT INTO public.neighborhood_activity (neighborhood, activity_score, energy_level, energy_emoji, label)
SELECT n.name, 0, 'calm', '☕', 'Calm right now'
FROM public.neighborhoods n
ON CONFLICT (neighborhood) DO NOTHING;

-- Prime the derived layers once on deploy.
SELECT public.compute_neighborhood_activity();
SELECT public.generate_city_signals();
