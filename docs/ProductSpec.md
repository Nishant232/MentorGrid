# Growth Mentor Grid — Product Specification

## 1. Vision & Goals
- **Vision**: A trusted marketplace where mentees quickly find relevant mentors and book high-quality sessions with minimal friction, while mentors monetize expertise and grow reputation.
- **Primary Goals**
  - **For mentees**: discover, evaluate, and book the right mentor within 5 minutes.
  - **For mentors**: manage availability, handle bookings/payments, and build reputation via ratings/leaderboards.
  - **For business**: achieve sustainable unit economics via session fees, subscriptions, and upsells.

## 2. Personas
- **Mentee Maya** (early-career PM/Founder)
  - Needs: discover relevant mentors, transparent pricing, easy scheduling, actionable advice
  - Success: books within 1-2 sessions, leaves positive review, returns monthly
- **Mentor Max** (senior IC/manager)
  - Needs: set availability, fair pricing, seamless calendar sync, reduced no-shows, payouts
  - Success: >4.8 rating, regular bookings, weekly leaderboard presence
- **Admin Alex** (ops/finance)
  - Needs: user moderation, mentor approvals, refunds/payouts, analytics, compliance
  - Success: low dispute rate, healthy supply/demand, growth metrics

## 3. Scope (MVP)
- Mentor discovery, booking, integrated calendar, video room, feedback/ratings, leaderboards, and admin panel.
- Out of scope (MVP): native mobile apps, group sessions, marketplace escrow (use provider), advanced cohort analytics.

## 4. User Stories
- **Discovery**
  - As a mentee, I can search mentors by expertise, tags, rating, price, and availability.
  - As a mentee, I can view mentor profile with bio, badges, reviews, availability slots, and price.
- **Booking**
  - As a mentee, I can select a slot in my timezone and confirm with credits or card.
  - As a mentee, I get confirmation email and can add to my calendar.
- **Mentor Ops**
  - As a mentor, I can define weekly availability and sync external calendars to block busy times.
  - As a mentor, I can accept/decline requests, message mentees, and track payouts.
- **Session**
  - As a user, I can join a secure video room with chat, notes, and screen share.
- **Feedback**
  - As a mentee, I can rate 1–5 stars, leave comments, and choose public/private snippet.
- **Progress**
  - As a mentee, I can view goals, completed sessions, notes, and streaks.
- **Admin**
  - As an admin, I can approve mentors, manage users, handle payments/refunds, view analytics.

## 5. IA & Navigation
- Public: Landing → Browse → Mentor Profile → Book
- Authenticated
  - **Mentee**: Home, Browse, Bookings, Messages, Progress, Profile, Settings
  - **Mentor**: Overview, Calendar, Bookings, Messages, Reviews, Profile, Settings
  - **Admin**: Users, Approvals, Payments, Analytics, Reports, Settings

## 6. Key Flows
- **Booking**: Browse → Profile → Select slot → Details → Payment/Confirm → Confirmation → Calendar invite
- **Availability (Mentor)**: Weekly template → Exceptions → External busy sync → Publish slots
- **Video Session**: Join room → Controls (mic/cam/share/record) → Notes/Chat → End → Feedback prompt

## 7. Functional Requirements
- **Search & Filters**
  - Keyword, categories/tags, rating, price range, availability window, timezone-aware.
- **Mentor Profile**
  - Bio, expertise tags, experience, price, session durations, badges, ratings, reviews, availability slots.
- **Booking**
  - Slot selection, conflict checks, booking status (requested/confirmed/cancelled/completed), notifications.
  - Payment with credits and card; refunds & no-show policy.
- **Calendar**
  - Weekly availability CRUD, exceptions/overrides, external busy ingestion, double-booking prevention.
- **Messaging**
  - Threaded messages per booking/user pair, basic attachments (URL), unread counts, notifications.
- **Video**
  - WebRTC provider integration, room per booking, lobby before host, recording (optional), chat/notes.
- **Feedback & Reviews**
  - Post-session rating (required), comments, public snippet toggle, moderation.
- **Gamification**
  - Weekly leaderboard, badges, streaks, awards summary.
- **Admin**
  - User and mentor approvals, KYC status, payouts, refunds, analytics, CSV export, feature flags.

## 8. Non-Functional Requirements
- **Performance**: P95 page load < 2.5s on 3G; search < 300ms server time.
- **Reliability**: 99.9% uptime target; idempotent booking/payment; at-least-once notifications.
- **Security & Privacy**: RBAC; row-level security (Supabase); PII encryption at rest; audit logs; GDPR basics.
- **Compliance**: Payment provider PCI scope; KYC/AML via provider; cookie consent.
- **Accessibility**: WCAG 2.1 AA; keyboard navigable; captions for recordings (later).
- **Internationalization**: Timezone-aware; currency display (USD baseline, extensible).

## 9. Data Model (Supabase mapping)
- `profiles` (users): id (UUID), role (mentor/mentee/admin), name, bio, avatar_url, timezone
- `mentor_profiles`: mentor_id (FK), expertise_tags[], price_cents, durations[], badges[], rating_avg, rating_count
- `availability`: mentor_id, weekday, start_time, end_time, repeat_rule, is_exception
- `external_busy`: mentor_id, start_ts, end_ts, source (google/outlook), meta
- `bookings`: id, mentor_id, mentee_id, start_ts, end_ts, status, price_cents, currency, room_id, notes
- `payments`: booking_id, status, amount_cents, provider, txn_id, refund_txn_id
- `messages`: id, booking_id (nullable), sender_id, recipient_id, body, created_at
- `reviews`: id, booking_id, mentee_id, mentor_id, rating, comment, is_public
- `leaderboard_weeks`: week_start, mentor_id, score, rank
- `awards`: id, mentor_id, type, period, meta
- `admin_actions`: id, admin_id, action, subject_id, meta, created_at

Note: See `src/integrations/supabase/types.ts` for generated types; enforce RLS policies per role.

## 10. Screens (Wireframe reference)
- Landing, Auth (Login/Signup), Mentor Dashboard (tabs), Mentee Dashboard (tabs), Booking Flow, Calendar (availability + bookings), Video Session, Feedback & Rating, Progress + Leaderboard, Admin Pane.

## 11. API Endpoints & Integrations
- **Supabase**: auth, row-level security, realtime (bookings/messages), SQL functions for conflict checks.
- **Calendar sync**: Google/Outlook OAuth, webhook or cron sync (`supabase/functions/calendar-sync`).
- **Payments**: Provider (Stripe or similar) for card/credits, webhooks for confirmed/refunds.
- **Video**: Provider SDK (e.g., Livekit/Daily) – room per `booking.room_id`.
- **Email/Notifications**: Transactional emails (booked, reminders, feedback prompt), in-app toasts.

## 12. Analytics & KPIs
- **Funnel**: Visit → Search → Profile View → Slot Pick → Payment → Confirmation
- **Product KPIs**
  - Search-to-booking conversion, time-to-first-booking, repeat rate, NPS, session completion rate
  - Mentor utilization (slots booked/available), cancellation/no-show rate, ARPU, LTV/CAC (biz)
- **Event Spec (examples)**
  - `search_performed`, `mentor_profile_viewed`, `slot_selected`, `booking_confirmed`, `payment_succeeded`, `session_joined`, `feedback_submitted`, `message_sent`

## 13. Risks & Mitigations
- Supply-demand imbalance → waitlists, pricing guidance, featured mentors
- No-shows → reminders, deposits, penalties, quick reschedule UX
- Calendar sync inconsistency → conflict checks at booking time, grace buffers
- Quality variance → reviews moderation, onboarding checks, badges

## 14. Milestones (MVP → V1)
- **M1 (MVP Core, 3–4 weeks)**: Discovery, booking, mentor availability, basic payments, video join, feedback, admin approvals.
- **M2 (Polish, 2–3 weeks)**: Calendar sync, reminders, refunds, leaderboard, basic analytics.
- **M3 (Scale, 3–4 weeks)**: Recording, payouts automation, reporting, advanced filters, performance.

## 15. Acceptance Criteria (high level)
- A mentee can discover and book a mentor end-to-end within 5 minutes.
- A mentor can publish availability and avoid double-bookings with external calendar busy times.
- Both can join a video session reliably and submit feedback afterward.
- Admin can approve mentors, process refunds, and view key metrics.

---
Owner: Product
Stakeholders: Engineering, Design, Ops, Finance
Last updated: YYYY-MM-DD


