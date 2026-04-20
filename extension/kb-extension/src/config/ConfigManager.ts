/**
 * ConfigManager: VS Code Settings & Secrets Management
 * 
 * Provides unified access to VS Code configuration settings, workspace settings,
 * and secure secret storage via VS Code SecretStorage API.
 * 
 * Configuration is read from package.json contributes.configuration section.
 * Supports both global (user-level) and workspace-level settings.
 */

import * as vscode from 'vscode';
import type { ExtensionContext } from 'vscode';
import type { IConfigManager, KBExtensionConfig } from '../types';
import { ConfigurationError } from '../types';

export class ConfigManager implements IConfigManager {
  private context: ExtensionContext | null = null;
  private isInitialized = false;
  private configChangeListeners: Array<(config: KBExtensionConfig) => void> = [];
  private configDisposable: vscode.Disposable | null = null;

  async initialize(context: ExtensionContext): Promise<void> {
    this.context = context;
    this.isInitialized = true;

    // Setup configuration change listener
    this.configDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('kbExtension')) {
        this.notifyConfigChange();
      }
    });

    await this.applyDefaults();
    console.log('[ConfigManager] Initialized');
  }

  /**
   * Get a global (user-level) setting
   */
  async getGlobalSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    this.ensureInitialized();
    try {
      const config = vscode.workspace.getConfiguration('kbExtension');
      const value = config.get<T>(key);
      return value !== undefined ? value : defaultValue;
    } catch (error) {
      console.error(`[ConfigManager] Error reading global setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set a global (user-level) setting
   */
  async setGlobalSetting<T>(key: string, value: T): Promise<void> {
    this.ensureInitialized();
    try {
      const config = vscode.workspace.getConfiguration('kbExtension');
      await config.update(key, value, vscode.ConfigurationTarget.Global);
      this.notifyConfigChange();
    } catch (error) {
      throw new ConfigurationError(`Failed to set global setting ${key}: ${String(error)}`);
    }
  }

  /**
   * Get a workspace-level setting
   */
  async getWorkspaceSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    this.ensureInitialized();
    try {
      const config = vscode.workspace.getConfiguration('kbExtension');
      const value = config.get<T>(key);
      return value !== undefined ? value : defaultValue;
    } catch (error) {
      console.error(`[ConfigManager] Error reading workspace setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set a workspace-level setting
   */
  async setWorkspaceSetting<T>(key: string, value: T): Promise<void> {
    this.ensureInitialized();
    try {
      const config = vscode.workspace.getConfiguration('kbExtension');
      await config.update(key, value, vscode.ConfigurationTarget.Workspace);
      this.notifyConfigChange();
    } catch (error) {
      throw new ConfigurationError(`Failed to set workspace setting ${key}: ${String(error)}`);
    }
  }

  /**
   * Store a secret securely via VS Code SecretStorage
   */
  async setSecret(key: string, value: string): Promise<void> {
    this.ensureInitialized();
    if (!this.context) {
      throw new ConfigurationError('Context not available for secret storage');
    }
    try {
      await this.context.secrets.store(key, value);
      console.log(`[ConfigManager] Secret stored: ${key}`);
    } catch (error) {
      throw new ConfigurationError(`Failed to store secret ${key}: ${String(error)}`);
    }
  }

  /**
   * Retrieve a secret from VS Code SecretStorage
   */
  async getSecret(key: string): Promise<string | undefined> {
    this.ensureInitialized();
    if (!this.context) {
      throw new ConfigurationError('Context not available for secret storage');
    }
    try {
      const value = await this.context.secrets.get(key);
      return value;
    } catch (error) {
      console.error(`[ConfigManager] Error retrieving secret ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Delete a secret from VS Code SecretStorage
   */
  async deleteSecret(key: string): Promise<void> {
    this.ensureInitialized();
    if (!this.context) {
      throw new ConfigurationError('Context not available for secret storage');
    }
    try {
      await this.context.secrets.delete(key);
      console.log(`[ConfigManager] Secret deleted: ${key}`);
    } catch (error) {
      throw new ConfigurationError(`Failed to delete secret ${key}: ${String(error)}`);
    }
  }

  /**
   * Get environment variable with optional default
   */
  getEnvVar(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  /**
   * Validate configuration values
   */
  async validate(): Promise<boolean> {
    try {
      const config = await this.getConfigSnapshot();

      // Validate embedding dimension
      if (config.embedding.dimension < 64 || config.embedding.dimension > 2048) {
        console.error('[ConfigManager] Invalid embedding dimension:', config.embedding.dimension);
        return false;
      }

      // Validate batch size
      if (config.embedding.batchSize < 1 || config.embedding.batchSize > 512) {
        console.error('[ConfigManager] Invalid batch size:', config.embedding.batchSize);
        return false;
      }

      // Validate search weight
      if (config.search.hybridSearchWeight < 0 || config.search.hybridSearchWeight > 1) {
        console.error('[ConfigManager] Invalid hybrid search weight:', config.search.hybridSearchWeight);
        return false;
      }

      // Validate topK
      if (config.search.topK < 1 || config.search.topK > 100) {
        console.error('[ConfigManager] Invalid topK:', config.search.topK);
        return false;
      }

      // Validate backup retention
      if (config.storage.backupRetention < 1 || config.storage.backupRetention > 365) {
        console.error('[ConfigManager] Invalid backup retention:', config.storage.backupRetention);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ConfigManager] Validation error:', error);
      return false;
    }
  }

  /**
   * Apply default values for any missing settings
   */
  async applyDefaults(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('kbExtension');

      // Define defaults
      const defaults: Record<string, unknown> = {
        'storage.databasePath': '~/.kbextension/data.db',
        'storage.autoBackup': true,
        'storage.backupRetention': 7,
        'embedding.provider': 'transformers',
        'embedding.model': 'all-MiniLM-L6-v2',
        'embedding.dimension': 384,
        'embedding.batchSize': 32,
        'embedding.cacheEmbeddings': true,
        'search.semanticProvider': 'qdrant',
        'search.fullTextEnabled': true,
        'search.hybridSearchWeight': 0.5,
        'search.topK': 10,
        'ui.theme': 'auto',
        'ui.sidebarPosition': 'left',
        'ui.autoRefresh': true,
        'advanced.logLevel': 'info',
        'advanced.enableDiagnostics': false,
        'advanced.connectionPoolSize': 5,
      };

      // Apply each default if not already set
      for (const [key, defaultValue] of Object.entries(defaults)) {
        const current = config.get(key);
        if (current === undefined) {
          await config.update(key, defaultValue, vscode.ConfigurationTarget.Global);
        }
      }
    } catch (error) {
      console.warn('[ConfigManager] Warning applying defaults:', error);
    }
  }

  /**
   * Get a snapshot of all configuration
   */
  async getConfigSnapshot(): Promise<KBExtensionConfig> {
    const config = vscode.workspace.getConfiguration('kbExtension');

    return {
      storage: {
        databasePath: config.get<string>('storage.databasePath') || '~/.kbextension/data.db',
        autoBackup: config.get<boolean>('storage.autoBackup') ?? true,
        backupRetention: config.get<number>('storage.backupRetention') ?? 7,
      },
      embedding: {
        provider: (config.get<string>('embedding.provider') as 'transformers' | 'ollama' | 'lm-studio') || 'transformers',
        model: config.get<string>('embedding.model') || 'all-MiniLM-L6-v2',
        dimension: config.get<number>('embedding.dimension') ?? 384,
        batchSize: config.get<number>('embedding.batchSize') ?? 32,
        cacheEmbeddings: config.get<boolean>('embedding.cacheEmbeddings') ?? true,
      },
      search: {
        semanticProvider: (config.get<string>('search.semanticProvider') as 'qdrant' | 'local') || 'qdrant',
        fullTextEnabled: config.get<boolean>('search.fullTextEnabled') ?? true,
        hybridSearchWeight: config.get<number>('search.hybridSearchWeight') ?? 0.5,
        topK: config.get<number>('search.topK') ?? 10,
      },
      ui: {
        theme: (config.get<string>('ui.theme') as 'auto' | 'light' | 'dark') || 'auto',
        sidebarPosition: (config.get<string>('ui.sidebarPosition') as 'left' | 'right') || 'left',
        autoRefresh: config.get<boolean>('ui.autoRefresh') ?? true,
      },
      advanced: {
        logLevel: (config.get<string>('advanced.logLevel') as 'error' | 'warn' | 'info' | 'debug') || 'info',
        enableDiagnostics: config.get<boolean>('advanced.enableDiagnostics') ?? false,
        connectionPoolSize: config.get<number>('advanced.connectionPoolSize') ?? 5,
      },
      secrets: {},
    };
  }

  /**
   * Get diagnostic dump of all configuration
   */
  async dumpConfig(): Promise<Record<string, unknown>> {
    return {
      initialized: this.isInitialized,
      config: await this.getConfigSnapshot(),
    };
  }

  /**
   * Register a listener for configuration changes
   */
  onConfigChange(callback: (config: KBExtensionConfig) => void): vscode.Disposable {
    this.configChangeListeners.push(callback);

    return {
      dispose: () => {
        const index = this.configChangeListeners.indexOf(callback);
        if (index > -1) {
          this.configChangeListeners.splice(index, 1);
        }
      },
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.configDisposable) {
      this.configDisposable.dispose();
      this.configDisposable = null;
    }
    this.configChangeListeners = [];
  }

  /**
   * Notify all listeners of configuration change
   */
  private async notifyConfigChange(): Promise<void> {
    const config = await this.getConfigSnapshot();
    for (const listener of this.configChangeListeners) {
      try {
        listener(config);
      } catch (error) {
        console.error('[ConfigManager] Error in config change listener:', error);
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new ConfigurationError('ConfigManager not initialized');
    }
  }
}
