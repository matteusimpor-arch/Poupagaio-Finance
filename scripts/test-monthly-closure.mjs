// Run with: npm install --no-save @electric-sql/pglite
//           node scripts/test-monthly-closure.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const owner = '00000000-0000-0000-0000-000000000001';
const space = '00000000-0000-0000-0000-000000000002';
const otherSpace = '00000000-0000-0000-0000-000000000003';
const migration = async (name) => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const close = async (cycle = '2026-09') => (await db.query(
  'SELECT * FROM public.fn_close_month($1, $2::varchar)', [space, cycle]
)).rows[0];
const reset = () => db.exec('DELETE FROM public.monthly_closures; DELETE FROM public.fixed_expenses;');

try {
  // Minimal isolated database; exercise the actual production PL/pgSQL function.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    INSERT INTO auth.users VALUES ('${owner}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$
      SELECT NULLIF(current_setting('test.user_id', true), '')::uuid
    $$;
    SET test.user_id = '${owner}';
    CREATE TABLE public.spaces (id uuid PRIMARY KEY, owner_id uuid);
    INSERT INTO public.spaces VALUES ('${space}', '${owner}'), ('${otherSpace}', '${owner}');
    CREATE TABLE public.space_members (space_id uuid, user_id uuid, role text);
    CREATE TABLE public.entries (space_id uuid, date date, amount numeric(12,2));
    CREATE TABLE public.fixed_expenses (space_id uuid, amount numeric(12,2), recurrence text, due_month integer, start_date date);
    CREATE TABLE public.variable_expenses (space_id uuid, date date, amount numeric(12,2));
    CREATE TABLE public.installments (space_id uuid, due_date date, amount numeric(12,2));
    INSERT INTO public.entries VALUES ('${space}', '2026-09-01', 1298.79);
    INSERT INTO public.installments VALUES ('${space}', '2026-09-10', 1298.79);
    INSERT INTO public.fixed_expenses VALUES ('${space}', 899.35, 'monthly', NULL, '2026-10-01');
  `);
  await db.exec(await migration('20260918_create_monthly_closures.sql'));
  const before = await close();
  assert.equal(Number(before.total_fixed_expenses), 899.35);
  assert.equal(Number(before.final_balance), -899.35);

  const fix = await migration('20260929_fix_monthly_closure_fixed_expense_start_date.sql');
  await db.exec(fix);
  await db.exec(fix); // Safe to reapply.
  const saved = (await db.query('SELECT * FROM public.monthly_closures')).rows[0];
  assert.deepEqual(saved, before, 'Migration must preserve existing snapshots');
  await db.exec('DELETE FROM public.monthly_closures');
  const after = await close();
  assert.equal(Number(after.total_income), 1298.79);
  assert.equal(Number(after.total_fixed_expenses), 0);
  assert.equal(Number(after.total_installments), 1298.79);
  assert.equal(Number(after.total_expenses), 1298.79);
  assert.equal(Number(after.final_balance), 0);
  await assert.rejects(close(), /já se encontra fechada/);
  console.log('PASS: reproduces R$899.35 regression; corrected snapshot balances to zero; duplicate blocked');

  for (const [label, recurrence, dueMonth, startDate, expected] of [
    ['monthly at start', 'monthly', null, '2026-09-01', 10],
    ['monthly before start', 'monthly', null, '2026-10-01', 0],
    ['monthly after start', 'monthly', null, '2025-12-01', 10],
    ['legacy null start', 'monthly', null, null, 10],
    ['yearly matching month', 'yearly', 9, '2026-09-01', 10],
    ['yearly different month', 'yearly', 10, '2025-01-01', 0],
    ['yearly future year', 'yearly', 9, '2027-09-01', 0],
    ['yearly legacy null', 'yearly', 9, null, 10],
  ]) {
    await reset();
    await db.query('INSERT INTO public.fixed_expenses VALUES ($1, 10, $2, $3, $4)', [space, recurrence, dueMonth, startDate]);
    await db.query("INSERT INTO public.fixed_expenses VALUES ($1, 999, 'monthly', NULL, NULL)", [otherSpace]);
    assert.equal(Number((await close()).total_fixed_expenses), expected, label);
    console.log(`PASS: ${label}; other space excluded`);
  }
  await reset();
  await assert.rejects(close('2026-13'), /Competência inválida/);
  await assert.rejects(close('9999-01'), /competências futuras/);
  await db.exec("SET test.user_id = '00000000-0000-0000-0000-000000000099'");
  await assert.rejects(close(), /não possui autorização/);
  await db.exec("SET test.user_id = ''");
  await assert.rejects(close(), /não autenticado/);
  assert.equal((await db.query('SELECT COUNT(*) FROM public.monthly_closures')).rows[0].count, 0);
  console.log('PASS: invalid/future cycles and unauthorized users cannot save snapshots');
} finally {
  await db.close();
}
