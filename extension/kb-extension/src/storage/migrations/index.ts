/**
 * Schema Migrations
 * 
 * Defines all database schema migrations from v1 forward.
 * Each migration includes up/down handlers and validation.
 * 
 * Versioning: Sequential (v1 → v2 → v3...)
 * Current: v1 (Initial schema)
 * Next: v2 (Planned for future: performance optimizations)
 */

import type { Database as SqlJsDatabase } from 'sql.js';
import type { Migration } from './types';
import { MigrationType } from './types';

/**
 * v1: Initial schema (baseline)
 * 
 * Includes:
 * - 8 core tables (documents, chunks, vectors, tags, collections, etc.)
 * - 2 junction tables for M2M relationships
 * - 3 views for analytics
 * - FTS5 virtual table with triggers
 * - Comprehensive indexes
 * - Cascade deletes and constraints
 */
export const v1: Migration = {
  version: 1,
  name: 'initial_schema',
  description:
    'Initial schema: documents, chunks, vectors, tags, collections, junctions, FTS5',
  type: MigrationType.SAFE,
  estimatedMs: 100,

  up: () => {
    // This migration is run at database initialization, not as an upgrade
    // See DatabaseConnection.initializeSchema()
  },

  down: () => {
    // Cannot downgrade from v1 (data loss)
    throw new Error('Cannot downgrade from v1 (initial schema)');
  },

  validate: (db: SqlJsDatabase): boolean => {
    const tables = [
      'documents',
      'chunks',
      'vectors',
      'tags',
      'collections',
      'document_tags',
      'document_collections',
      'ingestion_status',
      'schema_version',
    ];

    for (const table of tables) {
      try {
        const stmt = db.prepare(`SELECT COUNT(*) FROM ${table}`) as any;
        stmt.get();
      } catch {
        console.error(`[Migration] Validation failed: table ${table} missing`);
        return false;
      }
    }

    return true;
  },
};

/**
 * v2 (PLANNED): Document cache table for performance
 * 
 * Adds:
 * - document_cache table with cached summaries
 * - Index on cache update timestamp
 * - Trigger to invalidate cache on document update
 * 
 * Timeline: Post-v1 release
 * Status: Placeholder for future implementation
 */
export const v2: Migration = {
  version: 2,
  name: 'add_document_cache',
  description: 'Add document_cache table for performance optimization',
  type: MigrationType.SAFE,
  estimatedMs: 200,

  up: (db: SqlJsDatabase) => {
    // Create cache table
    db.exec(`
      CREATE TABLE document_cache (
        document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
        cached_summary TEXT,
        cached_chunk_count INTEGER,
        cached_token_count INTEGER,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid BOOLEAN DEFAULT 1
      );
    `);

    // Index for quick lookups
    db.exec(
      'CREATE INDEX idx_document_cache_valid ON document_cache(valid, cached_at);'
    );

    // Trigger: invalidate cache when document updated
    db.exec(`
      CREATE TRIGGER invalidate_document_cache_on_update
      AFTER UPDATE ON documents
      BEGIN
        UPDATE document_cache 
        SET valid = 0 
        WHERE document_id = NEW.id;
      END;
    `);

    // Trigger: delete cache when document deleted (cascade)
    db.exec(`
      CREATE TRIGGER delete_document_cache_on_delete
      AFTER DELETE ON documents
      BEGIN
        DELETE FROM document_cache WHERE document_id = OLD.id;
      END;
    `);
  },

  down: (db: SqlJsDatabase) => {
    db.exec('DROP TRIGGER IF EXISTS delete_document_cache_on_delete');
    db.exec('DROP TRIGGER IF EXISTS invalidate_document_cache_on_update');
    db.exec('DROP INDEX IF EXISTS idx_document_cache_valid');
    db.exec('DROP TABLE IF EXISTS document_cache');
  },

  validate: (db: SqlJsDatabase): boolean => {
    try {
      const stmt = db.prepare('SELECT COUNT(*) FROM document_cache') as any;
      stmt.get();
      return true;
    } catch {
      console.error('[Migration] Validation failed: document_cache table missing');
      return false;
    }
  },
};

/**
 * v3 (PLANNED): Query history and analytics
 * 
 * Adds:
 * - query_history table
 * - query_stats view
 * - User analytics tracking
 * 
 * Timeline: Post-v2 release
 * Status: Placeholder for future implementation
 */
export const v3: Migration = {
  version: 3,
  name: 'add_query_history',
  description: 'Add query_history table for analytics and optimization',
  type: MigrationType.SAFE,
  estimatedMs: 150,

  up: (db: SqlJsDatabase) => {
    db.exec(`
      CREATE TABLE query_history (
        id TEXT PRIMARY KEY,
        query_text TEXT NOT NULL,
        query_type TEXT CHECK (query_type IN ('search', 'filter', 'browse')),
        result_count INTEGER,
        execution_ms INTEGER,
        user_selected_result TEXT REFERENCES chunks(id) ON DELETE SET NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(
      'CREATE INDEX idx_query_history_executed_at ON query_history(executed_at DESC);'
    );
  },

  down: (db: SqlJsDatabase) => {
    db.exec('DROP INDEX IF EXISTS idx_query_history_executed_at');
    db.exec('DROP TABLE IF EXISTS query_history');
  },

  validate: (db: SqlJsDatabase): boolean => {
    try {
      const stmt = db.prepare('SELECT COUNT(*) FROM query_history') as any;
      stmt.get();
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * All registered migrations (in order)
 */
export const migrations: Migration[] = [v1, v2, v3];

/**
 * Get migration by version number
 */
export function getMigration(version: number): Migration | undefined {
  return migrations.find((m) => m.version === version);
}

/**
 * Get highest available migration version
 */
export function getLatestMigrationVersion(): number {
  return Math.max(...migrations.map((m) => m.version));
}
