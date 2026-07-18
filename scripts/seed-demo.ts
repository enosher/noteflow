// scripts/seed-demo.ts
//
// Fills the shared demo account with sample data, so a visitor's first
// screen looks like a working product, not an empty one. Safe to run
// again: it wipes the demo user's modules first, then rebuilds them.
// Run with:
//   npx tsx scripts/seed-demo.ts
//
// Uses the service-role key, so RLS is bypassed - this script must only
// ever run locally against .env.local, never ship to the client bundle.
//
// The actual seeding logic lives in lib/seed-demo-data.ts, shared with
// resetDemoAccount() (app/login/demo-actions.ts), which runs the same
// reset automatically on logout so every visitor gets the same intended
// state without anyone having to remember to run this by hand.

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { seedDemoAccountData } from '../lib/seed-demo-data';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO = process.env.DEMO_USER_ID!;

if (!url || !serviceKey || !DEMO) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DEMO_USER_ID');
  process.exit(1);
}

const db = createClient(url, serviceKey);

async function main() {
  await seedDemoAccountData(db, DEMO);

  console.log('Demo account seeded. Log in as demo@noteflow.app and check:');
  console.log('  - Dashboard: Recursion flagged weak, Inheritance strong');
  console.log('  - Recommendations: should surface a Recursion question');
  console.log('  - /review: 6 cards due, mixed SM-2 stages');
  console.log('  - CS2030S graph: 2 edges, Streams gated behind weak Recursion');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
