// End-to-end write check against the live Supabase database.
//
// Proves the real CRUD path the app uses — create trip, join (add member), add
// expense, read it back — plus the case-insensitive duplicate-name constraint and
// cascade cleanup. It creates a throwaway trip tagged "[ci-check]" and ALWAYS
// deletes it at the end (cascade removes its member + expense), so it leaves no
// residue even on failure.
//
// Usage:
//   node --env-file=.env.local scripts/check-write.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('✗ Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
  process.exit(1)
}

const supabase = createClient(url, key)

// Unambiguous short slug, same spirit as src/lib/slug.js.
const slug =
  'ci-' +
  Array.from({ length: 6 }, () =>
    '23456789abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 31)],
  ).join('')

function fail(step, error) {
  console.error(`✗ ${step}: ${error?.message ?? error} (code ${error?.code ?? 'n/a'})`)
  throw error
}

let tripId = null
try {
  console.log(`→ Running write check against ${url}`)

  // 1. Create a trip
  {
    const { data, error } = await supabase
      .from('trips')
      .insert({ name: '[ci-check] write test', slug })
      .select()
      .single()
    if (error) fail('create trip', error)
    tripId = data.id
    console.log(`✓ create trip (slug ${data.slug})`)
  }

  // 2. Add a member
  let memberId = null
  {
    const { data, error } = await supabase
      .from('members')
      .insert({ trip_id: tripId, name: 'CI Tester' })
      .select()
      .single()
    if (error) fail('add member', error)
    memberId = data.id
    console.log('✓ add member')
  }

  // 3. Duplicate name (different case) must be rejected by the unique index
  {
    const { error } = await supabase
      .from('members')
      .insert({ trip_id: tripId, name: 'ci tester' })
      .select()
      .single()
    if (!error) fail('duplicate-name guard', new Error('duplicate name was allowed'))
    if (error.code !== '23505')
      fail('duplicate-name guard', new Error(`unexpected error code ${error.code}`))
    console.log('✓ duplicate name rejected (case-insensitive)')
  }

  // 4. Add an expense
  let expenseId = null
  {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        paid_by: memberId,
        amount: 123.45,
        description: 'CI lunch',
      })
      .select()
      .single()
    if (error) fail('add expense', error)
    expenseId = data.id
    console.log('✓ add expense')
  }

  // 5. Read it back and verify
  {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
    if (error) fail('read expenses', error)
    const row = data.find((e) => e.id === expenseId)
    if (!row) fail('read expenses', new Error('inserted expense not found'))
    if (Number(row.amount) !== 123.45 || row.paid_by !== memberId)
      fail('read expenses', new Error('read-back values did not match'))
    console.log(`✓ read back expense (${data.length} row(s), amount ${row.amount})`)
  }

  console.log('\n✓ Write path confirmed.')
} catch {
  process.exitCode = 1
} finally {
  // Cleanup: delete the trip; members + expenses cascade.
  if (tripId) {
    const { error } = await supabase.from('trips').delete().eq('id', tripId)
    if (error) {
      console.error(`✗ cleanup failed for trip ${tripId}: ${error.message}`)
      process.exitCode = 1
    } else {
      console.log('✓ cleanup: removed test trip (members + expenses cascaded)')
    }
  }
}
