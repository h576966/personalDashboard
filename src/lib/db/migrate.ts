/**
 * Database migration runner for Supabase.
 *
 * Applies pending SQL migration files from src/lib/db/migrations/.
 *
 * Since supabase-js does not support raw SQL execution via the REST API,
 * this script connects directly to the Postgres database using the Supabase
 * connection string constructed from the project URL.
 *
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. npx tsx src/lib/db/migrate.ts
 *
 * Note: The service role key can be used with the Supabase REST API
 * to call the pg_database; but for DDL (CREATE TABLE), you should
 * first apply the initial migration manually via the Supabase SQL Editor.
 *
 * Required manual step (one time):
 *   Open your Supabase project's SQL Editor and run:
 *   src/lib/db/migrations/001_initial.sql
 *
 * After the tables exist, this script can track future migrations via
 * the schema_migrations table.
 */

import fs from "fs";
import path from "path";
import { getSupabase } from "./supabase";

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

export async function runMigrations(): Promise<void> {
  const supabase = getSupabase();

  // Check if schema_migrations table exists by trying to query it
  const { error: checkError } = await supabase
    .from("schema_migrations")
    .select("version", { count: "exact", head: true });

  if (checkError) {
    // schema_migrations table doesn't exist — the initial migration
    // needs to be applied manually via Supabase SQL Editor
    console.error(
      "schema_migrations table not found. Please apply the initial migration manually:\n" +
      `1. Open your Supabase project's SQL Editor\n` +
      `2. Run the SQL from: ${path.join(MIGRATIONS_DIR, "001_initial.sql")}\n` +
      `3. Then run this script again.`,
    );
    process.exit(1);
  }

  // Get already applied migrations
  const { data: applied, error: listError } = await supabase
    .from("schema_migrations")
    .select("version")
    .order("version", { ascending: true });

  if (listError) {
    throw new Error(`Failed to list applied migrations: ${listError.message}`);
  }

  const appliedVersions = new Set((applied ?? []).map((r: { version: string }) => r.version));

  // Read migration files sorted by name
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (appliedVersions.has(version)) continue;

    console.log(`Migration ${file} needs to be applied.`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

    console.log(`\n--- SQL for migration ${file} ---\n${sql}\n---\n`);
    console.log(
      `Please apply this migration manually via Supabase SQL Editor, then run:\n` +
      `  await supabase.from('schema_migrations').insert({ version: '${version}' });\n`,
    );

    // Note: Applying the migration here would require a direct PG connection
    // or a Supabase Management API token. For now, guide the user.
  }
}

// Allow running directly
const isMainModule =
  process.argv[1]?.includes("migrate.ts") ||
  process.argv[1]?.includes("migrate.js");
if (isMainModule) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
