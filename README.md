# Japan 2026 Family Planner

The family travel planner for Osaka, Kyoto and Tokyo. It includes a secure shared-PIN login, trip overview, mobile-first itinerary, safe event editing, family comments, suggestions, voting and a searchable Japan guide.

## What is included

- Next.js App Router, TypeScript and Tailwind CSS
- Supabase Auth, Postgres, RLS and server-rendered data
- Four family profiles behind one shared PIN
- All 27 supplied itinerary blocks across 4–12 July 2026
- Drag-and-drop with touch, mouse and keyboard support
- Atomic persistence that swaps time slots and rejects cross-day moves
- Safe editing of activity titles, times, notes and Google Maps links
- Family comments attached to itinerary activities
- Family suggestions with optional itinerary targets and one vote per person
- Searchable Japanese phrases, useful signs and place facts
- Real previews for flights and Japanese phrases
- Local preview mode when Supabase has not been configured
- Installable PWA with offline copies of the trip dashboard, nine itinerary days, guide, maps hub and ideas
- Offline/update status, safe-area support and cache clearing on logout

Deployment and phone-install instructions are in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Run the interface

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). Without environment variables the app enters preview mode using the supplied dataset. Preview drag changes are stored in that browser only.

## Connect hosted Supabase

1. Create a Supabase project.
2. In **Authentication → Providers → Anonymous Sign-Ins**, enable anonymous sign-ins.
3. Run the migration files in filename order in the Supabase SQL editor. Existing milestone-one projects only need to run `202606210002_itinerary_editing_comments.sql`.
4. Copy `.env.example` to `.env.local` and fill in the project values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FAMILY_ACCESS_PIN=123456
```

Use a PIN longer than the example. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never commit `.env.local`.

5. Seed the project once:

```powershell
npm.cmd run seed
```

The seed command refuses to overwrite an existing Japan 2026 trip. To deliberately replace it:

```powershell
npm.cmd run seed -- --reset
```

6. Restart the development server. The login page will now verify the family PIN and persist itinerary changes to Supabase.

## Quality checks

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Offline travel mode

The service worker is enabled in production deployments, avoiding stale development caches. After login, it saves the core trip pages for offline reading. Changes, comments, votes, external Google Maps and first-time page loads still require internet access. Signing out clears cached family trip pages from that device.

## Important files

- `supabase/migrations/202606210001_initial_schema.sql` — tables, secure functions and RLS
- `supabase/seed-data.json` — original supplied trip data
- `scripts/seed.mjs` — guarded data importer and normalizer
- `src/app/page.tsx` — trip overview
- `src/app/itinerary/page.tsx` — day-by-day itinerary
- `src/components/SortableTimeline.tsx` — accessible reorder and persistence behavior
