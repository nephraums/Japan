import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pin = process.env.FAMILY_ACCESS_PIN;

console.log("Environment:", {
  projectUrl: Boolean(url),
  anonKey: Boolean(anon),
  serviceKey: Boolean(service),
  validPinShape: /^\d{6,}$/.test(pin ?? ""),
});

if (!url || !anon || !service || !pin) process.exit(1);

const client = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const profiles = await client.rpc("get_login_profiles", {
  p_trip_slug: "japan-2026",
});
console.log(
  "Profiles:",
  profiles.error
    ? { code: profiles.error.code, message: profiles.error.message }
    : profiles.data.map((profile) => profile.display_name),
);

const anonymous = await client.auth.signInAnonymously();
console.log(
  "Anonymous auth:",
  anonymous.error
    ? { status: anonymous.error.status, message: anonymous.error.message }
    : "ok",
);

if (anonymous.error || profiles.error || !profiles.data[0]) process.exit(1);

const userId = anonymous.data.user.id;
try {
  const claim = await client.rpc("claim_family_profile", {
    p_profile_id: profiles.data[0].id,
    p_pin: pin,
  });
  console.log(
    "PIN claim:",
    claim.error ? { code: claim.error.code, message: claim.error.message } : "ok",
  );
  if (claim.error) process.exitCode = 1;
} finally {
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const cleanup = await admin.auth.admin.deleteUser(userId);
  console.log("Cleanup:", cleanup.error ? cleanup.error.message : "ok");
}

await client.auth.signOut();
process.exit(process.exitCode ?? 0);
