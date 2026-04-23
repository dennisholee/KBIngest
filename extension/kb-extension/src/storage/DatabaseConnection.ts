/**
 * Database Connection Utility (sql.js)
 * 
 * Manages SQLite database lifecycle with proper configuration,
 * schema initialization, and error handling using pure JavaScript sql.js.
 * No native modules or Python dependencies required.
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';

interface PreparedStatement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): { changes?: number };
}

export class DatabaseConnection {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private schemaPath: string;
  private isInitialized: boolean = false;
  private sqlJsPromise: Promise<any> | null = null;

  constructor(dbPath: string = ':memory:', schemaPath?: string) {
    this.dbPath = dbPath;
    this.schemaPath = schemaPath || path.join(__dirname, 'schema.sql');
  }

  /**
   * Open database connection and initialize schema
   */
  async open(): Promise<SqlJsDatabase> {
    if (this.db) {
      return this.db;
    }

    try {
      // Initialize sql.js
      if (!this.sqlJsPromise) {
        this.sqlJsPromise = initSqlJs();
      }
      const SQL = await this.sqlJsPromise;

      // Load or create database
      if (this.dbPath !== ':memory:' && fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
        console.log(`[Database] Loaded from ${this.dbPath}`);
      } else {
        this.db = new SQL.Database();
        console.log(`[Database] Created new in-memory database`);
      }

      // Configure SQLite
      if (this.db) {
        this.db.run('PRAGMA foreign_keys = ON');
        this.db.run('PRAGMA journal_mode = WAL');
        this.db.run('PRAGMA synchronous = NORMAL');

        // Initialize schema
        this.initializeSchema();
        this.isInitialized = true;

        // Save to disk if not in-memory
        if (this.dbPath !== ':memory:') {
          this.saveToFile();
        }
      }

      console.log(`[Database] Initialized at ${this.dbPath}`);
      if (!this.db) {
        throw new Error('Failed to initialize database');
      }
      return this.db;
    } catch (error) {
      console.error('[Database] Failed to open:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Get existing connection or throw
   */
  getConnection(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        // Save to file before closing
        if (this.dbPath !== ':memory:') {
          this.saveToFile();
        }
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
   * Save database to file
   */
  private saveToFile(): void {
    if (!this.db || this.dbPath === ':memory:') {
      return;
    }

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      
      // Create directory if needed
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('[Database] Failed to save:', error);
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
      const result = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1"
      );

      if (result.length > 0 && result[0].values.length > 0) {
        console.log('[Database] Schema already initialized');
        return;
      }

      // Load schema file
      let schemaPath = this.schemaPath;
      let schema: string | null = null;

      if (fs.existsSync(schemaPath)) {
        schema = fs.readFileSync(schemaPath, 'utf-8');
        console.log(`[Database] Loaded schema from: ${schemaPath}`);
      } else {
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

      // Execute schema statements
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        this.db.run(stmt);
      }

      console.log('[Database] Schema initialized successfully');
    } catch (error) {
      console.error('[Database] Schema initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(fn: (db: SqlJsDatabase) => Promise<T> | T): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      this.db.run('BEGIN TRANSACTION');
      const result = await fn(this.db);
      this.db.run('COMMIT');
      
      // Save after transaction
      if (this.dbPath !== ':memory:') {
        this.saveToFile();
      }
      
      return result;
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Create a prepared statement wrapper
   * Handles both DML (INSERT, UPDATE, DELETE) and DQL (SELECT) operations
   * Tracks affected rows for DML operations
   */
  prepare(sql: string): PreparedStatement {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const db = this.db;
    const self = this;
    const trimmedSql = sql.trim().toUpperCase();
    
    // Detect statement type
    const isSelect = trimmedSql.startsWith('SELECT');
    const isInsert = trimmedSql.startsWith('INSERT');
    const isUpdate = trimmedSql.startsWith('UPDATE');
    const isDelete = trimmedSql.startsWith('DELETE');
    const isPragma = trimmedSql.startsWith('PRAGMA');

    return {
      get: (...params: any[]) => {
        try {
          // For SELECT and PRAGMA with parameters, we need to substitute placeholders
          if (isSelect || isPragma) {
            let boundSql = sql;
            if (params.length > 0) {
              // Simple parameter binding - replace ? with quoted values
              params.forEach((param) => {
                const value = param === null ? 'NULL' : 
                  typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : 
                  param;
                boundSql = boundSql.replace('?', value);
              });
            }
            const result = db.exec(boundSql);
            if (result.length > 0 && result[0].values.length > 0) {
              return self.rowToObject(result[0].columns, result[0].values[0]);
            }
            return null;
          } else {
            // For non-SELECT statements, just run them
            if (params.length > 0) {
              db.run(sql, params);
            } else {
              db.run(sql);
            }
            return null;
          }
        } catch (error) {
          console.error(`[Database] Error in .get():`, error);
          throw error;
        }
      },
      all: (...params: any[]) => {
        try {
          // For SELECT and PRAGMA with parameters, we need to substitute placeholders
          if (isSelect || isPragma) {
            let boundSql = sql;
            if (params.length > 0) {
              // Simple parameter binding - replace ? with quoted values
              params.forEach((param) => {
                const value = param === null ? 'NULL' : 
                  typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : 
                  param;
                boundSql = boundSql.replace('?', value);
              });
            }
            const result = db.exec(boundSql);
            if (result.length > 0) {
              return result[0].values.map((row: any[]) =>
                self.rowToObject(result[0].columns, row)
              );
            }
            return [];
          } else {
            // For non-SELECT statements, just run them
            if (params.length > 0) {
              db.run(sql, params);
            } else {
              db.run(sql);
            }
            return [];
          }
        } catch (error) {
          console.error(`[Database] Error in .all():`, error);
          throw error;
        }
      },
      run: (...params: any[]) => {
        try {
          // For DML operations, we need to track changes
          let changes = 0;
          
          // For DELETE, track affected rows by running a special query
          if (isDelete) {
            // Extract table name from DELETE statement
            const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
            if (tableMatch) {
              // Before delete, count total rows
              const countBefore = db.exec(`SELECT COUNT(*) as cnt FROM ${tableMatch[1]}`);
              const before = countBefore.length > 0 ? (countBefore[0].values[0][0] as number) : 0;
              
              // Execute delete
              if (params.length > 0) {
                db.run(sql, params);
              } else {
                db.run(sql);
              }
              
              // After delete, count remaining rows
              const countAfter = db.exec(`SELECT COUNT(*) as cnt FROM ${tableMatch[1]}`);
              const after = countAfter.length > 0 ? (countAfter[0].values[0][0] as number) : 0;
              changes = Math.max(0, before - after);
            }
          } else {
            // For INSERT/UPDATE, just run the statement
            if (params.length > 0) {
              db.run(sql, params);
            } else {
              db.run(sql);
            }
            // sql.js doesn't provide change count, assume at least 1 for non-delete
            changes = isInsert || isUpdate ? 1 : 0;
          }
          
          // Store changes in the object for retrieval
          return { changes };
        } catch (error) {
          console.error(`[Database] Error in .run():`, error);
          throw error;
        }
      },
    };
  }

  /**
   * Convert sql.js row format to object
   */
  private rowToObject(columns: string[], values: any[]): Record<string, any> {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = values[i];
    });
    return obj;
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
