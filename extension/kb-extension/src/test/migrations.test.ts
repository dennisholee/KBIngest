/**
 * Schema Migration Tests
 * 
 * Tests for migration system including:
 * - Migration registration and discovery
 * - Migration plan creation
 * - Migration execution and validation
 * - Version tracking and history
 * - Error handling and rollback
 */

import { StorageManager } from '../storage/StorageManager';
import { MigrationRunner } from '../storage/migrations/MigrationRunner';
import { migrations, getLatestMigrationVersion } from '../storage/migrations/index';
import type { Migration } from '../storage/migrations/types';
import { MigrationType } from '../storage/migrations/types';

describe('Schema Migrations (S1.4)', () => {
  let storage: StorageManager;
  const testDbPath = ':memory:';

  beforeEach(async () => {
    storage = new StorageManager(testDbPath);
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.close();
  });

  // ===========================================================================
  // SECTION 1: MIGRATION RUNNER
  // ===========================================================================

  describe('1. MigrationRunner', () => {
    it('should initialize with empty migrations', () => {
      const runner = new MigrationRunner();
      expect(runner.getAvailableMigrations()).toHaveLength(0);
    });

    it('should register a single migration', () => {
      const runner = new MigrationRunner();
      const testMigration: Migration = {
        version: 1,
        name: 'test',
        description: 'Test migration',
        type: MigrationType.SAFE,
        estimatedMs: 100,
        up: () => {},
        down: () => {},
      };

      runner.register(testMigration);
      expect(runner.getAvailableMigrations()).toHaveLength(1);
    });

    it('should prevent duplicate migration registration', () => {
      const runner = new MigrationRunner();
      const testMigration: Migration = {
        version: 1,
        name: 'test',
        description: 'Test migration',
        type: MigrationType.SAFE,
        estimatedMs: 100,
        up: () => {},
        down: () => {},
      };

      runner.register(testMigration);
      expect(() => runner.register(testMigration)).toThrow(
        'already registered'
      );
    });

    it('should register batch of migrations', () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);
      expect(runner.getAvailableMigrations().length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // SECTION 2: CURRENT VERSION DETECTION
  // ===========================================================================

  describe('2. Current Version Detection', () => {
    it('should detect current schema version', async () => {
      const version = await storage.getCurrentSchemaVersion();
      expect(version).toBe(1);
    });

    it('should return version from schema_version table', async () => {
      const version = await storage.getCurrentSchemaVersion();
      expect(typeof version).toBe('number');
      expect(version).toBeGreaterThanOrEqual(1);
    });

    it('should handle missing schema_version table gracefully', async () => {
      const runner = new MigrationRunner();
      const mockDb = {
        prepare: () => ({
          get: () => {
            throw new Error('table not found');
          },
        }),
      } as any;

      const version = runner.getCurrentVersion(mockDb);
      expect(version).toBe(1);
    });
  });

  // ===========================================================================
  // SECTION 3: MIGRATION PLANNING
  // ===========================================================================

  describe('3. Migration Planning', () => {
    it('should create plan when no migrations needed', async () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const mockDb = {
        prepare: () => ({
          get: () => ({ version: 1 }),
        }),
      } as any;

      const plan = runner.createPlan(mockDb, 1);
      expect(plan.currentVersion).toBe(1);
      expect(plan.targetVersion).toBe(1);
      expect(plan.migrations).toHaveLength(0);
    });

    it('should prevent downgrade attempts', () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const mockDb = {
        prepare: () => ({
          get: () => ({ version: 3 }),
        }),
      } as any;

      expect(() => runner.createPlan(mockDb, 1)).toThrow(
        'Cannot downgrade'
      );
    });

    it('should create multi-step migration plan', () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const mockDb = {
        prepare: () => ({
          get: () => ({ version: 1 }),
        }),
      } as any;

      const plan = runner.createPlan(mockDb, 2);
      expect(plan.currentVersion).toBe(1);
      expect(plan.targetVersion).toBe(2);
      expect(plan.migrations.length).toBeGreaterThan(0);
      expect(plan.totalEstimatedMs).toBeGreaterThan(0);
    });

    it('should detect missing migration paths', () => {
      const runner = new MigrationRunner();
      
      // Register only v1 and v3, skip v2
      runner.register(migrations[0]); // v1
      runner.register(migrations[2]); // v3

      const mockDb = {
        prepare: () => ({
          get: () => ({ version: 1 }),
        }),
      } as any;

      expect(() => runner.createPlan(mockDb, 3)).toThrow(
        'No migration found'
      );
    });
  });

  // ===========================================================================
  // SECTION 4: MIGRATION EXECUTION
  // ===========================================================================

  describe('4. Migration Execution', () => {
    it('should execute migration within transaction', async () => {
      const runner = new MigrationRunner();

      let transactionCalled = false;
      const mockDb = {
        transaction: (fn: () => void) => {
          return () => {
            transactionCalled = true;
            fn();
          };
        },
        prepare: () => ({
          run: () => {},
        }),
      } as any;

      const testMigration: Migration = {
        version: 2,
        name: 'test',
        description: 'Test',
        type: MigrationType.SAFE,
        estimatedMs: 100,
        up: () => {},
        down: () => {},
      };

      const result = await runner.executeMigration(mockDb, testMigration, 1);
      
      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe(1);
      expect(transactionCalled).toBe(true);
    });

    it('should validate after migration if validator provided', async () => {
      const runner = new MigrationRunner({ validateAfterMigration: true });

      let validateCalled = false;
      const testMigration: Migration = {
        version: 2,
        name: 'test',
        description: 'Test',
        type: MigrationType.SAFE,
        estimatedMs: 100,
        up: () => {},
        down: () => {},
        validate: () => {
          validateCalled = true;
          return true;
        },
      };

      const mockDb = {
        transaction: (fn: () => void) => {
          return () => fn();
        },
        prepare: () => ({
          run: () => {},
        }),
      } as any;

      await runner.executeMigration(mockDb, testMigration, 1);
      expect(validateCalled).toBe(true);
    });

    it('should capture migration errors', async () => {
      const runner = new MigrationRunner();

      const testMigration: Migration = {
        version: 2,
        name: 'test',
        description: 'Test',
        type: MigrationType.SAFE,
        estimatedMs: 100,
        up: () => {
          throw new Error('Intentional error');
        },
        down: () => {},
      };

      const mockDb = {
        transaction: (fn: () => void) => {
          return () => {
            try {
              fn();
            } catch (e) {
              throw e;
            }
          };
        },
      } as any;

      const result = await runner.executeMigration(mockDb, testMigration, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorDetails).toBeDefined();
    });
  });

  // ===========================================================================
  // SECTION 5: STORAGE MANAGER INTEGRATION
  // ===========================================================================

  describe('5. StorageManager Integration', () => {
    it('should expose migration runner to storage manager', async () => {
      const version = await storage.getCurrentSchemaVersion();
      expect(typeof version).toBe('number');
      expect(version).toBeGreaterThanOrEqual(1);
    });

    it('should handle migrate without target version', async () => {
      // Should use latest available migration version
      await expect(storage.migrateSchema()).resolves.not.toThrow();
    });

    it('should handle already-current version', async () => {
      const current = await storage.getCurrentSchemaVersion();
      await expect(storage.migrateSchema(current)).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // SECTION 6: MIGRATION HISTORY
  // ===========================================================================

  describe('6. Migration History', () => {
    it('should retrieve migration history from database', async () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const conn = (storage as any).db.getConnection();
      const history = runner.getMigrationHistory(conn);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should include version, description, and timestamp in history', async () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const conn = (storage as any).db.getConnection();
      const history = runner.getMigrationHistory(conn);

      if (history.length > 0) {
        const entry = history[0];
        expect(entry).toHaveProperty('version');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('appliedAt');
        expect(entry.appliedAt instanceof Date).toBe(true);
      }
    });

    it('should handle missing schema_version table gracefully', () => {
      const runner = new MigrationRunner();

      const mockDb = {
        prepare: () => ({
          all: () => {
            throw new Error('table not found');
          },
        }),
      } as any;

      const history = runner.getMigrationHistory(mockDb);
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0);
    });
  });

  // ===========================================================================
  // SECTION 7: MIGRATION DISCOVERY
  // ===========================================================================

  describe('7. Migration Discovery', () => {
    it('should list all available migrations', () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const available = runner.getAvailableMigrations();
      expect(available.length).toBeGreaterThan(0);
      expect(available[0]).toHaveProperty('version');
      expect(available[0]).toHaveProperty('name');
      expect(available[0]).toHaveProperty('description');
    });

    it('should return latest migration version', () => {
      const latest = getLatestMigrationVersion();
      expect(typeof latest).toBe('number');
      expect(latest).toBeGreaterThanOrEqual(1);
    });

    it('should verify migration path availability', () => {
      const runner = new MigrationRunner();
      runner.registerBatch(migrations);

      const { canMigrate: canUpgrade } = runner.canMigrate(1, 2);
      expect(canUpgrade).toBe(true);
    });
  });

  // ===========================================================================
  // SECTION 8: ERROR HANDLING
  // ===========================================================================

  describe('8. Error Handling', () => {
    it('should fail gracefully on unregistered migration', () => {
      const runner = new MigrationRunner();
      
      const mockDb = {
        prepare: () => ({
          get: () => ({ version: 1 }),
        }),
      } as any;

      expect(() => runner.createPlan(mockDb, 99)).toThrow(
        'No migration found'
      );
    });

    it('should provide detailed error information on migration failure', async () => {
      const runner = new MigrationRunner();

      const failingMigration: Migration = {
        version: 2,
        name: 'failing_migration',
        description: 'This migration will fail',
        type: MigrationType.SAFE,
        estimatedMs: 100,
        up: () => {
          throw new Error('Specific migration error');
        },
        down: () => {},
      };

      const mockDb = {
        transaction: (fn: () => void) => {
          return () => fn();
        },
      } as any;

      const result = await runner.executeMigration(mockDb, failingMigration, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Specific migration error');
      expect(result.errorDetails?.message).toContain('Specific migration error');
    });
  });
});
