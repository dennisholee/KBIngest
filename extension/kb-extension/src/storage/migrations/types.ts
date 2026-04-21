/**
 * Schema Migration Types and Interfaces
 * 
 * Defines migration system contracts including:
 * - Migration definition interface
 * - Migration result types
 * - Migration execution strategies
 */

import type Database from 'better-sqlite3';

/**
 * Migration classification (determines deployment strategy)
 */
export enum MigrationType {
  /** Safe: Additive changes only (new tables, nullable columns, indexes) */
  SAFE = 'safe',
  
  /** Careful: Data transformation required (rename, type change, new NOT NULL) */
  CAREFUL = 'careful',
  
  /** Dangerous: Breaking changes (delete columns/tables, breaks compatibility) */
  DANGEROUS = 'dangerous',
}

/**
 * Individual migration definition
 */
export interface Migration {
  /** Version number (e.g., 1, 2, 3) */
  version: number;
  
  /** Short name (e.g., "add_document_cache") */
  name: string;
  
  /** Detailed description of changes */
  description: string;
  
  /** Migration classification */
  type: MigrationType;
  
  /** Estimated execution time in milliseconds */
  estimatedMs: number;
  
  /** Apply this migration (upgrade) */
  up(db: Database.Database): void | Promise<void>;
  
  /** Rollback this migration (downgrade) */
  down(db: Database.Database): void | Promise<void>;
  
  /** Validation check after migration */
  validate?(db: Database.Database): boolean;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  /** Whether migration succeeded */
  success: boolean;
  
  /** Version before migration */
  fromVersion: number;
  
  /** Version after migration (if successful) */
  toVersion?: number;
  
  /** Migration name */
  name?: string;
  
  /** Execution time in milliseconds */
  executionMs: number;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Detailed error object (if failed) */
  errorDetails?: Error;
}

/**
 * Migration plan for multi-step upgrades
 */
export interface MigrationPlan {
  /** Current schema version */
  currentVersion: number;
  
  /** Target schema version */
  targetVersion: number;
  
  /** Migrations to execute in order */
  migrations: Migration[];
  
  /** Total estimated time in milliseconds */
  totalEstimatedMs: number;
}

/**
 * Configuration for migration runner
 */
export interface MigrationRunnerConfig {
  /** Enable automatic backups before migration */
  autoBackup: boolean;
  
  /** Backup directory path */
  backupDir?: string;
  
  /** Throw error on validation failure */
  validateAfterMigration: boolean;
  
  /** Log migration details to console */
  verbose: boolean;
  
  /** Timeout for single migration in milliseconds */
  migrationTimeout: number;
}

/**
 * Migration history entry (stored in schema_version table)
 */
export interface MigrationHistoryEntry {
  version: number;
  description: string;
  appliedAt: Date;
}
