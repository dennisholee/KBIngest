/**
 * Database Connection Utility
 * 
 * Manages SQLite database lifecycle with proper configuration,
 * schema initialization, and error handling.
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class DatabaseConnection {
  private db: Database.Database | null = null;
  private dbPath: string;
  private schemaPath: string;
  private isInitialized: boolean = false;

  constructor(dbPath: string = ':memory:', schemaPath?: string) {
    this.dbPath = dbPath;
    this.schemaPath = schemaPath || path.join(__dirname, 'schema.sql');
  }

  /**
   * Open database connection and initialize schema
   */
  open(): Database.Database {
    if (this.db) {
      return this.db;
    }

    try {
      // Create directory if needed
      if (this.dbPath !== ':memory:') {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      // Open database
      this.db = new Database(this.dbPath);

      // Configure SQLite
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');

      // Initialize schema
      this.initializeSchema();
      this.isInitialized = true;

      console.log(`[Database] Initialized at ${this.dbPath}`);
      return this.db;
    } catch (error) {
      console.error('[Database] Failed to open:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Get existing connection or throw
   */
  getConnection(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close();
        console.log('[Database] Connection closed');
      } catch (error) {
        console.error('[Database] Error closing:', error);
      }
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Check if schema initialized
   */
  isSchemaInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Initialize schema on first connection
   */
  private initializeSchema(): void {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      // Check if schema already initialized
      const tables = this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      if (tables.length > 0) {
        console.log('[Database] Schema already initialized');
        return;
      }

      // Try multiple schema path locations
      let schemaPath = this.schemaPath;
      let schema: string | null = null;

      // Try direct path first
      if (fs.existsSync(schemaPath)) {
        schema = fs.readFileSync(schemaPath, 'utf-8');
        console.log(`[Database] Loaded schema from: ${schemaPath}`);
      } else {
        // Try relative paths for different module resolution environments
        const fallbackPaths = [
          path.join(__dirname, 'schema.sql'),
          path.join(__dirname, '../src/storage/schema.sql'),
          path.join(__dirname, '../../src/storage/schema.sql'),
        ];

        for (const fallbackPath of fallbackPaths) {
          if (fs.existsSync(fallbackPath)) {
            schema = fs.readFileSync(fallbackPath, 'utf-8');
            console.log(`[Database] Loaded schema from fallback: ${fallbackPath}`);
            break;
          }
        }

        if (!schema) {
          throw new Error(
            `Schema file not found. Tried: ${schemaPath}, ${fallbackPaths.join(', ')}`
          );
        }
      }

      if (!schema || schema.trim().length === 0) {
        throw new Error('Schema file is empty');
      }

      console.log(`[Database] Executing schema (${schema.length} bytes)`);
      
      // Execute schema
      this.db.exec(schema);
      console.log('[Database] Schema initialized successfully');
    } catch (error) {
      console.error('[Database] Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  transaction<T>(fn: (db: Database.Database) => T): T {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const txn = this.db.transaction(fn);
    return txn(this.db);
  }

  /**
   * Execute prepared statement
   */
  prepare(sql: string): Database.Statement<any> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.prepare(sql);
  }

  /**
   * Execute raw SQL
   */
  exec(sql: string): void {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    this.db.exec(sql);
  }

  /**
   * Get database health
   */
  getHealth(): { connected: boolean; initialized: boolean; path: string } {
    return {
      connected: this.isConnected(),
      initialized: this.isSchemaInitialized(),
      path: this.dbPath,
    };
  }
}

export function generateId(): string {
  return require('crypto').randomUUID();
}
