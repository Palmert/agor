#!/usr/bin/env tsx
/**
 * Migration: Change worktree_id foreign key from RESTRICT to CASCADE
 *
 * SQLite doesn't support ALTER CONSTRAINT, so we need to:
 * 1. Create new sessions table with CASCADE
 * 2. Copy data
 * 3. Drop old table
 * 4. Rename new table
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../client';

async function migrate() {
  console.log('🔄 Migrating foreign key constraint: worktree_id RESTRICT → CASCADE');

  // Use default database path
  const dbPath = join(homedir(), '.agor', 'agor.db');
  console.log(`  Database: ${dbPath}\n`);

  const db = createDatabase({ url: `file:${dbPath}` });

  try {
    // Step 1: Create new sessions table with CASCADE
    console.log('  Creating new sessions table with CASCADE...');
    await db.run(sql`
      CREATE TABLE sessions_new (
        session_id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        created_by TEXT NOT NULL DEFAULT 'anonymous',
        status TEXT NOT NULL CHECK(status IN ('idle', 'running', 'completed', 'failed')),
        agentic_tool TEXT NOT NULL CHECK(agentic_tool IN ('claude-code', 'cursor', 'codex', 'gemini')),
        board_id TEXT,
        parent_session_id TEXT,
        forked_from_session_id TEXT,
        worktree_id TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (worktree_id) REFERENCES worktrees(worktree_id) ON DELETE CASCADE
      )
    `);

    // Step 2: Copy all data
    console.log('  Copying data from old table...');
    await db.run(sql`
      INSERT INTO sessions_new
      SELECT * FROM sessions
    `);

    // Step 3: Drop old table
    console.log('  Dropping old sessions table...');
    await db.run(sql`DROP TABLE sessions`);

    // Step 4: Rename new table
    console.log('  Renaming new table...');
    await db.run(sql`ALTER TABLE sessions_new RENAME TO sessions`);

    // Step 5: Recreate indexes
    console.log('  Recreating indexes...');
    await db.run(sql`
      CREATE INDEX sessions_status_idx ON sessions(status)
    `);
    await db.run(sql`
      CREATE INDEX sessions_agentic_tool_idx ON sessions(agentic_tool)
    `);
    await db.run(sql`
      CREATE INDEX sessions_board_idx ON sessions(board_id)
    `);
    await db.run(sql`
      CREATE INDEX sessions_worktree_idx ON sessions(worktree_id)
    `);

    console.log('✅ Migration complete: Foreign key now uses CASCADE delete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
