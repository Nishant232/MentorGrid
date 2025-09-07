# Functional Requirements → Screens/Components Mapping

This document maps the Product Spec functional requirements to existing screens/components in the repository for implementation clarity.

## Legend
- Pages are under `src/pages/`
- Reusable UI are under `src/components/`
- Supabase types are under `src/integrations/supabase/types.ts`

---

## Discovery & Search
- Requirement: Keyword search, categories/tags, rating, price range, availability window, timezone-aware
  - Screens
    - `src/pages/FindMentor.tsx`
    - `src/pages/Index.tsx` (entry to browse CTA)
  - Components
    - `src/components/landing/Categories.tsx` (category pills/tiles)
    - `src/components/landing/LeaderboardPreview.tsx` (top mentors preview)
    - UI primitives: `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/slider.tsx`, `components/ui/badge.tsx`, `components/ui/tabs.tsx`, `components/ui/card.tsx`
  - Data
    - Mentors list: `profiles` + `mentor_profiles` from Supabase (`types.ts`)
    - Ratings: `reviews`
    - Availability window: `availability`, `external_busy`

## Mentor Profile
- Requirement: Bio, expertise tags, experience, price, durations, badges, ratings/reviews, availability slots
  - Screens
    - `src/pages/MentorProfile.tsx`
  - Components
    - Card/UI: `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/tabs.tsx`, `components/ui/avatar.tsx`, `components/ui/button.tsx`
    - Availability preview: `components/mentee/MentorAvailabilityView.tsx`
    - Reviews snippet: use `components/ui/accordion.tsx` or `components/ui/collapsible.tsx` for lists
  - Data
    - Mentor: `mentor_profiles`, `profiles`
    - Reviews: `reviews`
    - Slots: `availability`, `external_busy`

## Booking
- Requirement: Slot selection, conflict checks, booking status, notifications, payment (credits/card)
  - Screens
    - `src/pages/FindMentor.tsx` (select mentor → slot CTA)
    - `src/pages/MentorProfile.tsx` (slot picker entry)
    - `src/pages/SessionRoom.tsx` (room id after confirmation)
    - `src/pages/MenteeDashboard.tsx` (My bookings tab)
    - `src/pages/MentorDashboard.tsx` (Requests/Confirmed tabs)
  - Components
    - Availability: `components/mentee/MentorAvailabilityView.tsx`
    - Mentor controls: `components/mentor/AvailabilityManager.tsx`
    - Calendar primitives: `components/ui/calendar.tsx`, `components/ui/popover.tsx`, `components/ui/dialog.tsx`
    - Actions: `components/ui/button.tsx`, `components/ui/select.tsx`, `components/ui/textarea.tsx`
  - Data
    - `bookings`, `payments`, `availability`, `external_busy`
    - Conflict check: SQL function or server RPC (see `supabase/migrations/*booking_conflicts*`)

## Calendar (Mentor)
- Requirement: Weekly availability CRUD, exceptions, external busy ingestion, double-book prevention
  - Screens
    - `src/pages/MentorDashboard.tsx` (Calendar tab)
  - Components
    - `components/mentor/AvailabilityManager.tsx`
    - `components/mentor/CalendarSync.tsx` (Google/Outlook sync status)
    - UI: `components/ui/calendar.tsx`, `components/ui/switch.tsx`, `components/ui/checkbox.tsx`, `components/ui/dialog.tsx`
  - Data
    - `availability`, `external_busy`
    - OAuth/sync: `supabase/functions/calendar-oauth-callback/`, `supabase/functions/calendar-sync/`

## Messaging
- Requirement: Threads per booking/user, unread counts, notifications
  - Screens
    - `src/pages/MenteeDashboard.tsx` (Messages tab)
    - `src/pages/MentorDashboard.tsx` (Messages tab)
  - Components
    - UI: assemble from `components/ui/input.tsx`, `components/ui/button.tsx`, `components/ui/scroll-area.tsx`
  - Data
    - `messages` (threading by `booking_id` or user pair)

## Video Session
- Requirement: WebRTC provider, room per booking, lobby, recording, chat/notes
  - Screens
    - `src/pages/SessionRoom.tsx`
  - Components
    - Controls: build from `components/ui/button.tsx`, `components/ui/switch.tsx`, `components/ui/popover.tsx`, `components/ui/tooltip.tsx`
    - Sidecar: `components/ui/tabs.tsx`, `components/ui/textarea.tsx`, `components/ui/scroll-area.tsx`
  - Data
    - `bookings.room_id`

## Feedback & Reviews
- Requirement: Post-session rating (required), comments, public snippet toggle, moderation
  - Screens
    - `src/pages/MenteeDashboard.tsx` (post-session prompt)
  - Components
    - Rating input: `components/ui/slider.tsx` or custom stars; `components/ui/textarea.tsx`, `components/ui/switch.tsx`, `components/ui/button.tsx`
  - Data
    - `reviews` (links to `booking_id`, `mentor_id`, `mentee_id`)

## Progress & Leaderboard
- Requirement: Goals, completed sessions, streaks, awards, weekly leaderboard
  - Screens
    - `src/pages/MenteeDashboard.tsx` (Progress tab)
    - `src/pages/Index.tsx` (Leaderboard preview)
    - `src/pages/MentorDashboard.tsx` (Overview shows rank/snapshot)
  - Components
    - `src/components/landing/LeaderboardPreview.tsx`
    - UI: `components/ui/card.tsx`, `components/ui/table.tsx`, `components/ui/badge.tsx`, `components/ui/tabs.tsx`, `src/components/ui/chart.tsx`
  - Data
    - `leaderboard_weeks`, `awards`, `bookings`, `reviews`

## Admin
- Requirement: Users, mentor approvals, KYC status, payouts, refunds, analytics, CSV export, feature flags
  - Screens
    - `src/pages/admin/AdminLayout.tsx`
    - `src/pages/admin/Users.tsx`
    - `src/pages/admin/Approvals.tsx`
    - `src/pages/admin/Payments.tsx`
    - `src/pages/admin/Analytics.tsx`
    - `src/pages/admin/Reports.tsx`
  - Components
    - UI: `components/ui/table.tsx`, `components/ui/dialog.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/select.tsx`, `components/ui/input.tsx`
  - Data
    - `profiles`, `mentor_profiles`, `payments`, `admin_actions`

---

## Cross-cutting: Notifications & Emails
- Toaster/in-app: `src/components/ui/sonner.tsx`, `src/components/ui/toast.tsx`, `src/components/ui/use-toast.ts`
- Email triggers: Supabase functions/webhooks; confirmations, reminders, feedback prompts

## Cross-cutting: Auth & Onboarding
- Screens
  - `src/pages/Auth.tsx`
  - `src/pages/Onboarding.tsx`
  - `src/components/onboarding/RoleSelection.tsx`
  - `src/components/onboarding/MenteeProfileForm.tsx`
  - `src/components/onboarding/MentorProfileForm.tsx`

## Cross-cutting: Pricing & Payments
- Screens/Components
  - Booking details modals and confirmations (built in respective pages)
  - UI: `components/ui/dialog.tsx`, `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/button.tsx`
- Data
  - `payments`, `bookings` with price fields; provider webhooks

---

## Gaps / To-be-built
- Dedicated Mentor Profile page layout may need expansion for reviews/slots.
- Messaging UI wrapper (compose + thread list) to be assembled from primitives.
- Payment form/credit application UX to be implemented.
- Video provider integration (SDK glue code) for `SessionRoom`.

## Traceability Matrix (High level)
- FR-Search → `FindMentor.tsx`, `Categories.tsx`, UI filters
- FR-Profile → `MentorProfile.tsx`, `MentorAvailabilityView.tsx`
- FR-Booking → `FindMentor.tsx`, `MentorProfile.tsx`, `MenteeDashboard.tsx`, `MentorDashboard.tsx`
- FR-Calendar → `AvailabilityManager.tsx`, `CalendarSync.tsx`, Dashboard Calendar tab
- FR-Messaging → Dashboard Messages tabs (mentor/mentee)
- FR-Video → `SessionRoom.tsx`
- FR-Feedback → `MenteeDashboard.tsx`
- FR-Leaderboard → `LeaderboardPreview.tsx`, dashboards overview
- FR-Admin → `admin/*`
