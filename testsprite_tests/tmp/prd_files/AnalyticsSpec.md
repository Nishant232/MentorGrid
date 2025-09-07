# Analytics Specification

Purpose: Instrument end-to-end mentee booking and mentor supply health, enabling rapid product iteration and growth.

## Tracking Framework
- Client library: Posthog/Segment (abstracted as `track(event, props)`).
- User identity: ensure `user_id` after auth; use anonymous id pre-auth and alias on login/signup.
- Privacy: avoid storing PII in properties; reference IDs.

---

## Events & Properties

### Discovery
- `search_performed`
  - props: { query, categories: string[], min_rating?: number, price_range?: [min,max], availability_window?: {from,to}, results_count }
- `mentor_profile_viewed`
  - props: { mentor_user_id, source: landing|search|share, rank_position?: number }
- `category_clicked`
  - props: { category }

### Booking
- `slot_selected`
  - props: { mentor_user_id, start_time, end_time, timezone, duration_minutes }
- `booking_details_submitted`
  - props: { mentor_user_id, topic?: string, notes_length?: number }
- `payment_started`
  - props: { booking_id, amount_cents, currency, method: card|credits }
- `payment_succeeded`
  - props: { booking_id, amount_cents, currency, method, provider }
- `booking_confirmed`
  - props: { booking_id, mentor_user_id, mentee_user_id, start_time, end_time }
- `booking_cancelled`
  - props: { booking_id, by: mentor|mentee, reason?: string }

### Session
- `session_joined`
  - props: { booking_id, role: mentor|mentee, join_time, late_seconds }
- `session_ended`
  - props: { booking_id, duration_minutes, reason: completed|no_show|disconnect }
- `message_sent`
  - props: { booking_id, length }
- `note_saved`
  - props: { booking_id, length }

### Feedback & Reputation
- `feedback_submitted`
  - props: { booking_id, rating, comment_length, is_public?: boolean }
- `review_viewed`
  - props: { reviewee_user_id }

### Supply & Calendar
- `availability_rule_created`
  - props: { weekday, start_minute, end_minute }
- `availability_exception_created`
  - props: { date, start_minute, end_minute, is_available }
- `calendar_sync_connected`
  - props: { provider }
- `calendar_sync_error`
  - props: { provider, code }

### Auth & Onboarding
- `signup_started`
  - props: { method: email|sso, role }
- `signup_completed`
  - props: { role }
- `onboarding_completed`
  - props: { role }

### Gamification
- `streak_day_recorded`
  - props: { user_id, current_streak_days }
- `achievement_unlocked`
  - props: { code }

---

## Funnels

### F1: Mentee Booking Funnel
1. `search_performed`
2. `mentor_profile_viewed`
3. `slot_selected`
4. `booking_details_submitted`
5. `payment_started`
6. `payment_succeeded`
7. `booking_confirmed`

Metrics: step conversion %, time between steps, drop-off reasons, median time-to-booking.

### F2: Mentor Activation Funnel
1. `signup_completed` (role=mentor)
2. `availability_rule_created`
3. `calendar_sync_connected`
4. First `booking_confirmed`

Metrics: mentor activation rate, time to first booking, % with calendar sync, supply sufficiency.

### F3: Session Completion Funnel
1. `booking_confirmed`
2. `session_joined` (both roles)
3. `session_ended` (completed)
4. `feedback_submitted`

Metrics: completion rate, no-show rate, feedback rate, average rating.

---

## Cohorts & Retention
- Weekly cohorts by `signup_completed` date; track % who reach `booking_confirmed` within 7/14/30 days.
- Mentee repeat bookings: count bookings per mentee in 30/60/90-day windows.
- Mentor retention: active mentors per week (have at least one `availability_rule_created` and one `booking_confirmed`).

---

## Dashboards

### Product Health
- Cards: Search→Booking conversion, Time-to-first-booking (median), Session completion rate, Average rating
- Charts: F1 funnel, F3 funnel over time, weekly active mentors/mentees

### Supply & Quality
- Cards: Mentors with active availability, Calendar sync rate, Avg rating last 30d
- Tables: Top mentors (confirmed sessions, avg rating), Low-rating alerts (<4)

### Revenue
- Cards: GMV (sum of `payment_succeeded.amount_cents`), Refund rate, ARPM (avg revenue per mentor)
- Charts: GMV by week, AOV (avg order value)

---

## Implementation Notes
- Tie events to IDs from Supabase: `booking_id`, `mentor_user_id`, `mentee_user_id`.
- Fire client events from pages/components mapped in `docs/RequirementsToScreens.md`.
- Consider server-side events (webhooks) for `payment_succeeded` reliability.
- Enrich events with context: device, timezone, referral.

## Acceptance
- F1, F2, F3 funnels visible with up-to-date data.
- Key product health metrics available and accurate within 24h.
