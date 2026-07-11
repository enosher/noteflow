// scripts/seed-all.ts
//
// Backfills SEED_MODULES into every existing account, one-time. Accounts
// created after this runs get the same data via the "Load sample data"
// button (app/modules/sample-data-actions.ts) instead.
//
// Uses the service-role key to bypass RLS. Safe to re-run: it skips
// module codes an account already has, so nothing gets duplicated.
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
