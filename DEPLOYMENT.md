# Deployment and travel-readiness checklist

## Deploy to Vercel

1. Put this project in a private GitHub repository.
2. In Vercel, choose **Add New → Project**, import the repository and keep the detected Next.js settings.
3. Add these Production, Preview and Development environment variables:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   The service-role key and family PIN are only required by the local seed and diagnostic scripts. Do not add them to Vercel unless a future server-only feature genuinely needs them.
4. Deploy, then open the assigned HTTPS URL and test login on each family phone.
5. In Supabase, keep anonymous sign-ins enabled and add the final Vercel domain under **Authentication → URL Configuration → Site URL**.

## Install on family phones

- **iPhone:** open the deployed site in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** use the in-app **Install app** button when offered, or Chrome’s **Install app** menu item.
- Log in and open the app once while online. The app then refreshes and saves the home page, all nine itinerary days, maps hub, guide and ideas page for offline reading.

## What works offline

- Previously saved app pages and itinerary days remain readable.
- Internal navigation switches to full saved pages while offline.
- A visible offline badge confirms that the app is using saved content.
- Google Maps, fresh Supabase updates, comments, votes and edits require a connection.
- On reconnection, reopening the app refreshes the saved pages.

Offline copies contain family trip information in the phone browser’s storage. Use a phone passcode. Signing out clears the Japan 2026 caches on that device.

## Before flying

1. Install the production app on all four phones.
2. Log in on each phone and leave the app open online for about 30 seconds while it saves the trip.
3. Turn on airplane mode and verify Home, all itinerary days and Guide open.
4. Turn connectivity back on and confirm an itinerary edit synchronises between two phones.
5. Save essential booking PDFs and Google Maps offline areas separately; browser caching is not a substitute for airline documents or offline map downloads.

## Release checks

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

After each production deployment, open the installed app online once. When an update badge appears, tap **Update** to activate the latest version.
