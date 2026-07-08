// scripts/seed-all.ts
//
// Backfills SEED_MODULES (lib/seed-data.ts) into every existing
// account. Run this once now to populate current test/dev accounts —
// any account created AFTER this runs gets the same data via the
// "Load sample data" button on an empty Modules page
// (app/modules/sample-data-actions.ts), so this script never needs a
// cron job or a repeat run against the same account.
//
// Uses the service-role key to bypass RLS and read every profile.
// Safe to re-run: seedAccountData() skips module codes an account
// already has, so accounts that were backfilled last time (or that
// have grown their own real CS2030S/GEA1000 module — vanishingly
// unlikely, but the guard costs nothing) are left untouched.
//
// Run with:
//   npx tsx scripts/seed-all.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { seedAccountData } from '../lib/seed-data';
import type { Database } from '../lib/types/database';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient<Database>(url, serviceKey);

async function main() {
  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, display_name');
  if (error) throw error;

  console.log(`Seeding ${profiles.length} account(s)...`);

  for (const p of profiles) {
    const label = p.display_name ?? p.id;
    const result = await seedAccountData(db, p.id);
    if (result.seededCodes.length > 0) {
      console.log(`  ${label}: added ${result.seededCodes.join(', ')}`);
    }
    if (result.skippedCodes.length > 0) {
      console.log(
        `  ${label}: already had ${result.skippedCodes.join(', ')}, left alone`
      );
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
