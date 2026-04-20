/**
 * ConfigManager Unit Tests
 * 
 * Comprehensive test coverage for VS Code settings management,
 * secrets storage, and configuration validation.
 */

jest.mock('vscode');

import { ConfigManager } from '../config/ConfigManager';
import { ConfigurationError } from '../types';
import * as vscode from 'vscode';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockContext: any;
  let mockConfig: any;

  beforeEach(() => {
    // Create mock context
    mockContext = {
      secrets: {
        store: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    };

    // Create mock configuration object
    mockConfig = {
      get: jest.fn((key: string) => {
        const defaults: Record<string, any> = {
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
        return defaults[key];
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);
    (vscode.workspace.onDidChangeConfiguration as jest.Mock).mockReturnValue({
      dispose: jest.fn(),
    });

    configManager = new ConfigManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SECTION 1: LIFECYCLE MANAGEMENT
  // ===========================================================================

  describe('1. Lifecycle Management', () => {
    test('should initialize without errors', async () => {
      await configManager.initialize(mockContext);
      expect(configManager).toBeDefined();
    });

    test('should throw error when accessing settings before initialization', async () => {
      await expect(
        configManager.getGlobalSetting('storage.databasePath')
      ).rejects.toThrow(ConfigurationError);
    });

    test('should setup config change listener on initialization', async () => {
      await configManager.initialize(mockContext);
      expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });

    test('should dispose resources', async () => {
      await configManager.initialize(mockContext);
      configManager.dispose();
      expect(configManager).toBeDefined();
    });
  });

  // ===========================================================================
  // SECTION 2: GLOBAL SETTINGS
  // ===========================================================================

  describe('2. Global Settings', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should read global setting with value', async () => {
      mockConfig.get.mockReturnValue('custom-value');
      const value = await configManager.getGlobalSetting('custom.key', 'default');
      expect(value).toBe('custom-value');
    });

    test('should return default for missing global setting', async () => {
      mockConfig.get.mockReturnValue(undefined);
      const value = await configManager.getGlobalSetting('nonexistent.key', 'default');
      expect(value).toBe('default');
    });

    test('should set global setting', async () => {
      await configManager.setGlobalSetting('test.key', 'test-value');
      expect(mockConfig.update).toHaveBeenCalledWith(
        'test.key',
        'test-value',
        vscode.ConfigurationTarget.Global
      );
    });

    test('should read database path setting', async () => {
      const path = await configManager.getGlobalSetting('storage.databasePath');
      expect(path).toBe('~/.kbextension/data.db');
    });

    test('should read embedding model setting', async () => {
      const model = await configManager.getGlobalSetting('embedding.model');
      expect(model).toBe('all-MiniLM-L6-v2');
    });

    test('should read embedding dimension setting', async () => {
      const dimension = await configManager.getGlobalSetting('embedding.dimension');
      expect(dimension).toBe(384);
    });

    test('should handle error when reading setting', async () => {
      mockConfig.get.mockImplementation(() => {
        throw new Error('Configuration read error');
      });
      const value = await configManager.getGlobalSetting('test.key', 'default');
      expect(value).toBe('default');
    });

    test('should handle error when setting value', async () => {
      mockConfig.update.mockRejectedValue(new Error('Configuration write error'));
      await expect(
        configManager.setGlobalSetting('test.key', 'value')
      ).rejects.toThrow(ConfigurationError);
    });
  });

  // ===========================================================================
  // SECTION 3: WORKSPACE SETTINGS
  // ===========================================================================

  describe('3. Workspace Settings', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should read workspace setting', async () => {
      mockConfig.get.mockReturnValue('workspace-value');
      const value = await configManager.getWorkspaceSetting('custom.key', 'default');
      expect(value).toBe('workspace-value');
    });

    test('should return default for missing workspace setting', async () => {
      mockConfig.get.mockReturnValue(undefined);
      const value = await configManager.getWorkspaceSetting('nonexistent.key', 'default');
      expect(value).toBe('default');
    });

    test('should set workspace setting', async () => {
      await configManager.setWorkspaceSetting('test.key', 'workspace-value');
      expect(mockConfig.update).toHaveBeenCalledWith(
        'test.key',
        'workspace-value',
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('should handle error when setting workspace value', async () => {
      mockConfig.update.mockRejectedValue(new Error('Workspace write error'));
      await expect(
        configManager.setWorkspaceSetting('test.key', 'value')
      ).rejects.toThrow(ConfigurationError);
    });
  });

  // ===========================================================================
  // SECTION 4: SECRET STORAGE
  // ===========================================================================

  describe('4. Secret Storage', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should store secret', async () => {
      await configManager.setSecret('api-key', 'secret-value');
      expect(mockContext.secrets.store).toHaveBeenCalledWith('api-key', 'secret-value');
    });

    test('should retrieve secret', async () => {
      mockContext.secrets.get.mockResolvedValue('secret-value');
      const value = await configManager.getSecret('api-key');
      expect(value).toBe('secret-value');
      expect(mockContext.secrets.get).toHaveBeenCalledWith('api-key');
    });

    test('should return undefined for missing secret', async () => {
      mockContext.secrets.get.mockResolvedValue(undefined);
      const value = await configManager.getSecret('nonexistent-key');
      expect(value).toBeUndefined();
    });

    test('should delete secret', async () => {
      await configManager.deleteSecret('api-key');
      expect(mockContext.secrets.delete).toHaveBeenCalledWith('api-key');
    });

    test('should throw error if context not available', async () => {
      const newManager = new ConfigManager();
      await newManager.initialize({ ...mockContext, secrets: null });
      await expect(newManager.setSecret('key', 'value')).rejects.toThrow(ConfigurationError);
    });

    test('should handle error when storing secret fails', async () => {
      mockContext.secrets.store.mockRejectedValue(new Error('Secret store failed'));
      await expect(
        configManager.setSecret('api-key', 'value')
      ).rejects.toThrow(ConfigurationError);
    });

    test('should handle error when retrieving secret fails', async () => {
      mockContext.secrets.get.mockRejectedValue(new Error('Secret read failed'));
      const value = await configManager.getSecret('api-key');
      expect(value).toBeUndefined();
    });
  });

  // ===========================================================================
  // SECTION 5: ENVIRONMENT VARIABLES
  // ===========================================================================

  describe('5. Environment Variables', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should read environment variable', () => {
      process.env.TEST_VAR = 'test-value';
      const value = configManager.getEnvVar('TEST_VAR');
      expect(value).toBe('test-value');
      delete process.env.TEST_VAR;
    });

    test('should return default for missing environment variable', () => {
      const value = configManager.getEnvVar('NONEXISTENT_VAR', 'default');
      expect(value).toBe('default');
    });

    test('should not require initialization for env vars', () => {
      process.env.TEST_VAR = 'test-value';
      const value = configManager.getEnvVar('TEST_VAR');
      expect(value).toBe('test-value');
      delete process.env.TEST_VAR;
    });
  });

  // ===========================================================================
  // SECTION 6: CONFIGURATION VALIDATION
  // ===========================================================================

  describe('6. Configuration Validation', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should validate correct configuration', async () => {
      const isValid = await configManager.validate();
      expect(isValid).toBe(true);
    });

    test('should reject invalid embedding dimension (too small)', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'embedding.dimension') {
          return 30;
        }
        return 384;
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });

    test('should reject invalid embedding dimension (too large)', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'embedding.dimension') {
          return 3000;
        }
        return 384;
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });

    test('should reject invalid batch size', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'embedding.batchSize') {
          return 600;
        }
        return 32;
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });

    test('should reject invalid hybrid search weight', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'search.hybridSearchWeight') {
          return 1.5;
        }
        return 0.5;
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });

    test('should reject invalid topK', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'search.topK') {
          return 200;
        }
        return 10;
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });

    test('should reject invalid backup retention', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'storage.backupRetention') {
          return 400;
        }
        return 7;
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });

    test('should handle validation error', async () => {
      mockConfig.get.mockImplementation(() => {
        throw new Error('Config error');
      });

      const isValid = await configManager.validate();
      expect(isValid).toBe(false);
    });
  });

  // ===========================================================================
  // SECTION 7: CONFIGURATION SNAPSHOT
  // ===========================================================================

  describe('7. Configuration Snapshot', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should get complete config snapshot', async () => {
      const config = await configManager.getConfigSnapshot();
      expect(config).toBeDefined();
      expect(config.storage).toBeDefined();
      expect(config.embedding).toBeDefined();
      expect(config.search).toBeDefined();
      expect(config.ui).toBeDefined();
      expect(config.advanced).toBeDefined();
    });

    test('should return correct storage config', async () => {
      const config = await configManager.getConfigSnapshot();
      expect(config.storage.databasePath).toBe('~/.kbextension/data.db');
      expect(config.storage.autoBackup).toBe(true);
      expect(config.storage.backupRetention).toBe(7);
    });

    test('should return correct embedding config', async () => {
      const config = await configManager.getConfigSnapshot();
      expect(config.embedding.provider).toBe('transformers');
      expect(config.embedding.model).toBe('all-MiniLM-L6-v2');
      expect(config.embedding.dimension).toBe(384);
    });

    test('should return correct search config', async () => {
      const config = await configManager.getConfigSnapshot();
      expect(config.search.semanticProvider).toBe('qdrant');
      expect(config.search.fullTextEnabled).toBe(true);
      expect(config.search.hybridSearchWeight).toBe(0.5);
      expect(config.search.topK).toBe(10);
    });

    test('should apply defaults when values undefined', async () => {
      mockConfig.get.mockReturnValue(undefined);
      const config = await configManager.getConfigSnapshot();
      expect(config.embedding.dimension).toBe(384);
      expect(config.search.topK).toBe(10);
    });
  });

  // ===========================================================================
  // SECTION 8: DIAGNOSTICS
  // ===========================================================================

  describe('8. Diagnostics', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should dump configuration', async () => {
      const dump = await configManager.dumpConfig();
      expect(dump).toBeDefined();
      expect(dump.initialized).toBe(true);
      expect(dump.config).toBeDefined();
    });

    test('should include all config sections in dump', async () => {
      const dump = await configManager.dumpConfig();
      const config = dump.config as any;
      expect(config.storage).toBeDefined();
      expect(config.embedding).toBeDefined();
      expect(config.search).toBeDefined();
    });
  });

  // ===========================================================================
  // SECTION 9: CONFIGURATION CHANGE LISTENER
  // ===========================================================================

  describe('9. Configuration Change Listener', () => {
    beforeEach(async () => {
      await configManager.initialize(mockContext);
    });

    test('should register config change listener', async () => {
      const listener = jest.fn();
      const disposable = configManager.onConfigChange(listener);
      expect(disposable).toBeDefined();
      expect(disposable.dispose).toBeDefined();
    });

    test('should dispose listener', () => {
      const listener = jest.fn();
      const disposable = configManager.onConfigChange(listener);
      disposable.dispose();
      expect(disposable.dispose).toBeDefined();
    });
  });

  // ===========================================================================
  // SECTION 10: DEFAULT VALUES APPLICATION
  // ===========================================================================

  describe('10. Default Values Application', () => {
    test('should apply defaults on initialization', async () => {
      mockConfig.get.mockReturnValue(undefined);
      await configManager.initialize(mockContext);
      expect(mockConfig.update).toHaveBeenCalled();
    });

    test('should not override existing settings', async () => {
      mockConfig.get.mockReturnValue('existing-value');
      await configManager.initialize(mockContext);
      expect(mockConfig.get).toHaveBeenCalled();
    });
  });
});
