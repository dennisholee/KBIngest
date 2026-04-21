/**
 * Migration Runner
 * 
 * Orchestrates schema migrations with versioning, validation, and rollback support.
 * Handles:
 * - Discovering available migrations
 * - Creating migration plans
 * - Executing migrations with transaction safety
 * - Validating migration results
 * - Recording migration history
 */

import type { Database as SqlJsDatabase } from 'sql.js';
import type {
  Migration,
  MigrationPlan,
  MigrationResult,
  MigrationRunnerConfig,
} from './types';

export class MigrationRunner {
  private migrations: Map<number, Migration> = new Map();
  private config: MigrationRunnerConfig;

  constructor(config: Partial<MigrationRunnerConfig> = {}) {
    this.config = {
      autoBackup: true,
      validateAfterMigration: true,
      verbose: false,
      migrationTimeout: 30000,
      ...config,
    };
  }

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    if (this.migrations.has(migration.version)) {
      throw new Error(
        `Migration v${migration.version} already registered (${migration.name})`
      );
    }
    this.migrations.set(migration.version, migration);

    if (this.config.verbose) {
      console.log(
        `[MigrationRunner] Registered: v${migration.version} - ${migration.name}`
      );
    }
  }

  /**
   * Register multiple migrations at once
   */
  registerBatch(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.register(migration);
    }
  }

  /**
   * Get current schema version from database
   */
  getCurrentVersion(db: SqlJsDatabase): number {
    try {
      const stmt = db.prepare(
        'SELECT MAX(version) as version FROM schema_version'
      ) as any;
      const result = stmt.get() as { version: number | null };
      return result.version ?? 1;
    } catch {
      return 1; // If table doesn't exist, assume v1
    }
  }

  /**
   * Create a migration plan from current version to target
   */
  createPlan(
    db: SqlJsDatabase,
    targetVersion: number
  ): MigrationPlan {
    const currentVersion = this.getCurrentVersion(db);

    if (currentVersion === targetVersion) {
      return {
        currentVersion,
        targetVersion,
        migrations: [],
        totalEstimatedMs: 0,
      };
    }

    if (currentVersion > targetVersion) {
      throw new Error(
        `Cannot downgrade from v${currentVersion} to v${targetVersion}. ` +
          'Downgrade via rollback not supported.'
      );
    }

    // Build migration chain from current → target
    const migrations: Migration[] = [];
    let version = currentVersion;

    while (version < targetVersion) {
      const nextVersion = version + 1;
      const migration = this.migrations.get(nextVersion);

      if (!migration) {
        throw new Error(
          `No migration found for v${version} → v${nextVersion}. ` +
            `Available: ${Array.from(this.migrations.keys()).join(', ')}`
        );
      }

      migrations.push(migration);
      version = nextVersion;
    }

    const totalEstimatedMs = migrations.reduce(
      (sum, m) => sum + m.estimatedMs,
      0
    );

    return {
      currentVersion,
      targetVersion,
      migrations,
      totalEstimatedMs,
    };
  }

  /**
   * Execute a single migration with transaction safety
   */
  async executeMigration(
    db: SqlJsDatabase,
    migration: Migration,
    fromVersion: number
  ): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
      if (this.config.verbose) {
        console.log(
          `[Migration] Starting: v${fromVersion} → v${migration.version} (${migration.name})`
        );
      }

      // Execute within transaction (manual for sql.js)
      try {
        db.run('BEGIN TRANSACTION');
        
        migration.up(db);

        // Record in schema_version table
        const stmt = db.prepare(
          'INSERT INTO schema_version (version, description) VALUES (?, ?)'
        ) as any;
        stmt.run(migration.version, migration.description);
        
        db.run('COMMIT');
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }

      // Validate if validator provided
      if (migration.validate && this.config.validateAfterMigration) {
        const isValid = migration.validate(db);
        if (!isValid) {
          throw new Error(`Validation failed for migration v${migration.version}`);
        }
      }

      const executionMs = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(
          `[Migration] ✓ Complete: v${migration.version} (${executionMs}ms)`
        );
      }

      return {
        success: true,
        fromVersion,
        toVersion: migration.version,
        name: migration.name,
        executionMs,
      };
    } catch (error) {
      const executionMs = Date.now() - startTime;

      if (this.config.verbose) {
        console.error(
          `[Migration] ✗ Failed: v${migration.version} after ${executionMs}ms`,
          error
        );
      }

      return {
        success: false,
        fromVersion,
        name: migration.name,
        executionMs,
        error: error instanceof Error ? error.message : String(error),
        errorDetails: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Execute complete migration plan
   */
  async migrate(
    db: SqlJsDatabase,
    targetVersion: number
  ): Promise<MigrationResult[]> {
    const plan = this.createPlan(db, targetVersion);

    if (plan.migrations.length === 0) {
      if (this.config.verbose) {
        console.log(
          `[Migration] Already at v${targetVersion}, no migrations needed`
        );
      }
      return [];
    }

    if (this.config.verbose) {
      console.log(
        `[Migration] Plan: ${plan.migrations.length} migrations ` +
          `(${plan.totalEstimatedMs}ms estimated)`
      );
    }

    const results: MigrationResult[] = [];
    let currentVersion = plan.currentVersion;

    for (const migration of plan.migrations) {
      const result = await this.executeMigration(db, migration, currentVersion);
      results.push(result);

      if (!result.success) {
        console.error('[Migration] Plan aborted due to failure');
        break;
      }

      currentVersion = migration.version;
    }

    return results;
  }

  /**
   * Get list of available migrations
   */
  getAvailableMigrations(): Array<{
    version: number;
    name: string;
    description: string;
  }> {
    return Array.from(this.migrations.values())
      .sort((a, b) => a.version - b.version)
      .map((m) => ({
        version: m.version,
        name: m.name,
        description: m.description,
      }));
  }

  /**
   * Get migration history from database
   */
  getMigrationHistory(db: SqlJsDatabase): Array<{
    version: number;
    description: string;
    appliedAt: Date;
  }> {
    try {
      const stmt = db.prepare(
        'SELECT version, description, applied_date FROM schema_version ORDER BY version DESC'
      ) as any;
      const rows = stmt.all() as Array<{
        version: number;
        description: string;
        applied_date: number;
      }>;

      return rows.map((row) => ({
        version: row.version,
        description: row.description,
        appliedAt: new Date(row.applied_date),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Check if migration path is available
   */
  canMigrate(
    currentVersion: number,
    targetVersion: number
  ): { canMigrate: boolean; gap?: number } {
    if (currentVersion >= targetVersion) {
      return { canMigrate: true };
    }

    // Check for continuous chain
    for (let v = currentVersion; v < targetVersion; v++) {
      if (!this.migrations.has(v + 1)) {
        return { canMigrate: false, gap: v + 1 };
      }
    }

    return { canMigrate: true };
  }
}

/**
 * Global migration registry
 */
export const globalMigrationRunner = new MigrationRunner({ verbose: true });
