# Data Model Alignment (Supabase ↔ Product Spec)

This document maps the current Supabase schema (types + migrations) to the Product Spec and highlights gaps and decisions.

Sources reviewed:
- `src/integrations/supabase/types.ts`
- `supabase/migrations/20250829053100_add_bookings_and_sessions.sql`
- `supabase/migrations/20250829070000_calendar_availability.sql`
- `supabase/migrations/20250829074500_booking_conflicts_and_busy.sql`
- `supabase/migrations/20250829080000_reviews_public_and_dual.sql`

---

## Core Entities

### Users & Profiles
- Spec: `profiles` with role, name, avatar, timezone; separate `mentor_profiles` and `mentee_profiles` detail tables.
- Current:
  - `profiles` (id, email, full_name, avatar_url, role app_role[mentor|mentee], onboarding_completed, timestamps)
  - `mentor_profiles` (bio, expertise_areas, skills, hourly_rate, currency, timezone, languages, certifications, years_experience, is_active, availability Json?)
  - `mentee_profiles` (bio, goals[], interests[], current_level, budget_range, learning_style, preferred_meeting_frequency, timezone)
- Alignment: Matches intent. Note: `profiles.id` and `profiles.user_id` both exist; ensure one canonical PK/foreign key usage in queries (prefer `profiles.user_id` FK to `auth.users.id`).

### Availability & Calendar
- Spec: weekly rules, exceptions, external busy cache, calendar accounts.
- Current:
  - `mentor_availability_rules` (weekday, start_minute, end_minute, timezone, is_active)
  - `mentor_availability_exceptions` (date, start_minute, end_minute, is_available, notes)
  - `calendar_accounts` (provider enum google|microsoft, tokens, sync_enabled, email)
  - `external_busy_events` (cached busy windows per provider)
  - Functions: `get_mentor_busy(...)`
- Alignment: Complete for MVP. Timezone captured on rules. External busy cached and merged by function.

### Bookings & Sessions
- Spec: bookings with status, price, currency, room, provider; session messages/log; conflict-checked creation.
- Current:
  - `bookings` (mentor_user_id, mentee_user_id, start_time, end_time, duration_minutes STORED, price_cents, currency, status enum, meeting_provider, meeting_room, meeting_url, notes, timestamps)
  - `session_messages` (booking_id, sender_user_id, message)
  - Function: `create_booking_if_free(...)` ensures no conflicts (mentor busy + mentee overlap)
- Alignment: Matches and includes atomic create function. Room fields present; provider default 'jitsi'.

### Reviews
- Spec: rating 1–5, comment, public/private option, one per participant.
- Current:
  - `reviews` (booking_id, reviewer_user_id, reviewee_user_id, rating, feedback)
  - Unique: composite `(booking_id, reviewer_user_id)`
  - Policy updated to public SELECT (anyone can view)
- Gap vs Spec: No `is_public` flag. Current policy exposes all reviews publicly. Decision: either keep public-by-default (doc updated) or add `is_public boolean default true` + policy filter.

### Gamification / Leaderboard
- Spec: weekly leaderboard, awards, streaks, XP.
- Current:
  - Tables: `achievements`, `user_achievements`, `user_stats`, `xp_events`
  - Views: `leaderboard`, `leaderboard_week`
- Alignment: Provides XP/streaks and leaderboards per week and overall. Awards table (per spec) not present; can leverage `achievements` or add `awards` if needed.

---

## Enums
- `app_role`: `mentor | mentee` (Spec also mentions admin; see Admin section)
- `calendar_provider`: `google | microsoft`
- `booking_status`: `pending | confirmed | cancelled | completed | declined`
- `xp_event`: `signup | complete_profile | first_session | session_completed | review_given | review_received | streak_day`

Decision: Admin role handled via separate RBAC (not in `app_role`) or add `admin` to enum and restrict via RLS. See Admin.

---

## Security & RLS
- RLS enabled on: `bookings`, `session_messages`, `reviews`, `mentor_availability_rules`, `mentor_availability_exceptions`, `calendar_accounts`, `external_busy_events`.
- Policies:
  - Bookings: participants can read/update; mentee can insert
  - Messages: participants can read/insert
  - Reviews: now public read; insert restricted to participants
  - Availability & calendar: user-owned CRUD; external_busy insert/update via service role

Alignment: Matches Spec. Consider audit logs for admin actions (not present).

---

## Integrations & Functions
- `get_mentor_busy(mentor_id, from, to)` returns busy windows from bookings and external busy
- `create_booking_if_free(...)` does conflict-checked insert atomically

Alignment: Satisfies conflict prevention requirement.

---

## Gaps vs Spec (Action Items)
1. Reviews privacy
   - Spec: `is_public` toggle per review
   - Current: No column; reviews are publicly readable by policy
   - Decision: EITHER accept public-by-default OR add `is_public boolean not null default true` and update policy to `USING (is_public OR participant)`.

2. Admin data
   - Spec: `admin_actions` audit, feature flags
   - Current: None
   - Action: Add `admin_actions` (admin_id uuid, action text, subject_id uuid, meta jsonb, created_at).

3. Payments
   - Spec: `payments` table with provider txns, refunds
   - Current: Not present
   - Action: Add `payments` table referencing `bookings` with status, amount, provider, txn_id, refund_txn_id, timestamps.

4. Awards
   - Spec: `awards` (e.g., Top Mentor of Week)
   - Current: Not present; we have `achievements`
   - Decision: Use `achievements` for static badges; add `awards` for periodic recognitions (mentor_id, type, period_start, period_end, meta jsonb).

5. Profiles timezone
   - Spec: timezone on profile
   - Current: `mentor_profiles.timezone`, `mentee_profiles.timezone`; `profiles` lacks timezone
   - Decision: Keep timezone at role-profile level; optional to duplicate on `profiles` for simplicity.

6. Roles & Admin
   - Spec mentions admin role
   - Current: `app_role` excludes admin
   - Decision: Manage admins via `auth.users` + separate `admins` table or extend enum to include `admin` and adjust RLS accordingly.

7. Meeting provider integration fields
   - Spec: room per booking, provider
   - Current: `meeting_provider`, `meeting_room`, `meeting_url` present — OK.

---

## Proposed Minimal Migrations (if adopting Spec fully)

1) Add payments
```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  amount_cents INT NOT NULL,
  provider TEXT NOT NULL,
  txn_id TEXT,
  refund_txn_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

2) Add optional reviews privacy
```sql
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;
-- adjust policy if making privacy effective
-- CREATE POLICY ... USING (is_public OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.mentor_user_id = auth.uid() OR b.mentee_user_id = auth.uid())));
```

3) Admin audit
```sql
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  subject_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

4) Awards (optional)
```sql
CREATE TABLE IF NOT EXISTS public.awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Conclusion
- The current schema aligns closely with the Product Spec for MVP: discovery, availability, bookings, session messages, reviews, and gamification are in place.
- Recommended additions for completeness: `payments`, `admin_actions`, optional `reviews.is_public`, and `awards`.
- No breaking changes required for core flows; additions can be layered iteratively.
