// Lightweight Supabase connectivity check.
//
// Usage:
//   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/check-connection.mjs
// or put the vars in .env.local and run:
//   node --env-file=.env.local scripts/check-connection.mjs
//
// It verifies: env vars present -> client can reach the project -> the migration
// tables exist and are readable under the public RLS policy.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    '✗ Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n' +
      '  (copy .env.example to .env.local and fill them in, then re-run with\n' +
      '  `node --env-file=.env.local scripts/check-connection.mjs`).',
  )
  process.exit(1)
}

const supabase = createClient(url, key)

console.log(`→ Connecting to ${url} …`)

let failed = false
for (const table of ['trips', 'members', 'expenses']) {
  const { error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    failed = true
    console.error(`✗ ${table}: ${error.message} (code ${error.code ?? 'n/a'})`)
  } else {
    console.log(`✓ ${table}: reachable (${count ?? 0} rows)`)
  }
}

if (failed) {
  console.error('\nConnection check failed.')
  process.exit(1)
}
console.log('\n✓ Supabase connection confirmed.')
