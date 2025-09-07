## Growth Mentor Grid – Developer Guide

Production-ready React (Vite + TypeScript + Tailwind + shadcn-ui) app with Supabase for auth, database, and Edge Functions. This README covers local setup, scripts, database/functions, and exactly where you must plug in your own values.

### Tech Stack
- React 18, TypeScript, Vite
- Tailwind CSS, shadcn-ui (Radix)
- TanStack Query
- Supabase (Auth, Postgres, Edge Functions)

---

## 1) Prerequisites
- Node.js 18+ and npm 9+
- Git
- Optional (recommended for DB/functions): Supabase CLI `npm i -g supabase`

Verify:
```powershell
node -v
npm -v
```

---

## 2) Install & Run
```powershell
# From the project root
npm install

# Start dev server at http://localhost:8080
npm run dev

# Type-check/lint
npm run lint

# Build for production
npm run build

# Preview production build (serves on http://localhost:4173)
npm run preview
```

Dev server port is configured in `vite.config.ts` (host `::`, port `8080`).

---

## 3) Required Configuration (What you must change)

### A. Supabase project credentials
Update your Supabase URL and anon key in:
- `src/integrations/supabase/client.ts`

Replace the placeholders with your project’s values from Supabase → Project Settings → API.

```ts
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR-ANON-KEY";
```

Notes:
- These are currently hardcoded. For production, consider moving them to Vite env vars (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and reading via `import.meta.env`.
- After changing values, restart the dev server.

### B. Supabase Auth redirect URLs
Add the following to Supabase → Authentication → URL Configuration:
- `http://localhost:8080` (development)
- Your production domain (when deployed)

If using OAuth providers, configure provider callback URLs to point to your domain(s).

### C. Calendar OAuth (if you use calendar syncing)
Review and configure:
- Supabase Edge Function: `supabase/functions/calendar-oauth-callback/index.ts`
- Frontend integration: `src/components/mentor/CalendarSync.tsx`

What to change:
- OAuth client credentials for the provider you choose (e.g., Google). Set them in the function or as Supabase function env vars.
- Allowed callback/redirect URIs in your provider to include your domain and local dev URL. The function path typically is `/functions/v1/calendar-oauth-callback`.

### D. Database and RLS policies
Run the provided migrations to create tables, RLS, and policies (see Section 4). If you change table names or schemas later, update corresponding TypeScript types in:
- `src/integrations/supabase/types.ts`

### E. Branding & basic content
Optional but common changes:
- Favicon: `public/favicon.ico`
- Hero image: `src/assets/hero-mentorship.jpg`
- Landing sections: `src/components/landing/*`
- Routes & nav: `src/App.tsx`

### F. Port or host (optional)
To change dev server port/host, edit `vite.config.ts`:
```ts
server: { host: "::", port: 8080 }
```

---

## 4) Database Setup (Supabase)

You can use a hosted Supabase project or a local Supabase instance via the CLI.

### Option 1: Hosted Supabase (recommended)
1. Create a new project at `https://app.supabase.com`.
2. Get your `Project URL` and `anon` key and place them in `src/integrations/supabase/client.ts`.
3. Apply migrations:
   - Open Supabase SQL Editor and run the SQL from the migration files in `supabase/migrations/` in chronological order:
     - `20250829042946_...sql`
     - `20250829043036_...sql`
     - `20250829053100_add_bookings_and_sessions.sql`
     - `20250829070000_calendar_availability.sql`
     - `20250829074500_booking_conflicts_and_busy.sql`
     - `20250829080000_reviews_public_and_dual.sql`
     - `20250829081000_gamification.sql`
     - `20250829090000_weekly_leaderboard_and_top_mentor.sql`

### Option 2: Local Supabase (CLI)
```powershell
# Start local stack
supabase start

# Open Studio (optional) and copy local URL/anon key into client.ts
# Apply migrations
supabase migration up

# Stop local stack when done
supabase stop
```

---

## 5) Edge Functions (optional but included)
Functions live under `supabase/functions/`:
- `calendar-oauth-callback/`
- `calendar-sync/`
- `weekly-awards/`

Deploy (hosted project):
```powershell
supabase functions deploy calendar-oauth-callback
supabase functions deploy calendar-sync
supabase functions deploy weekly-awards
```

Local invoke (while `supabase start` is running):
```powershell
supabase functions serve --env-file ./supabase/.env
```

Where to change things:
- Function-specific env vars: project dashboard → Functions → Settings, or pass via CLI `--env-file`.
- OAuth callback URL(s): in your provider settings, add the function URL `https://<PROJECT-REF>.functions.supabase.co/calendar-oauth-callback` and your local URL when serving locally.

---

## 6) Application Structure (high-level)
- `src/App.tsx`: Routes for all pages (dashboard, onboarding, admin, etc.)
- `src/pages/*`: Page-level components
- `src/components/*`: UI and feature components
- `src/integrations/supabase/*`: Supabase client and generated DB types
- `supabase/migrations/*`: SQL for schema and policies
- `supabase/functions/*`: Edge Functions

---

## 7) Common Tasks

### Update routes or add pages
Edit `src/App.tsx`. Add `<Route path="/your-path" element={<YourComponent />} />`.

### Query data
Use the exported `supabase` client from `src/integrations/supabase/client.ts` and TanStack Query for fetching/caching.

### Styling
Tailwind is enabled in `index.css` and `tailwind.config.ts`. shadcn-ui components live under `src/components/ui/`.

---

## 8) Production Notes
- Build artifacts: `dist/` (via `npm run build`)
- Host on any static host (Vercel/Netlify/etc). Ensure your Supabase Auth redirect URLs include your production domain.
- If you change the site origin, add it to Supabase Auth → Redirect URLs and CORS settings (if applicable).

---

## 9) Quick Checklist (what you must set)
- Supabase URL and anon key in `src/integrations/supabase/client.ts`
- Supabase Auth redirect URLs (dev + prod)
- Run all SQL migrations in `supabase/migrations/`
- Configure calendar OAuth (if used): provider credentials, callback URIs
- Update branding assets (`public/favicon.ico`, images) and content as desired

---

## 10) Scripts Reference
```json
{
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

---

## 11) Troubleshooting
- Blank screen or network errors: verify Supabase URL/key and CORS/auth URLs.
- Auth callback fails: confirm redirect URLs in Supabase and OAuth provider.
- DB errors: confirm migrations ran in correct order and RLS policies exist.
- Port already in use: change `port` in `vite.config.ts` or stop the other process.

---

## 12) License
Proprietary – internal use unless otherwise specified by the repository owner.
