/**
 * KB Extension: Entry Point
 * 
 * Main activation point for the VS Code extension.
 * Coordinates initialization of configuration management, storage layer,
 * and command registration.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from './config/ConfigManager';
import { StorageManager } from './storage/StorageManager';
import { KBChatParticipant } from './chat/ChatParticipant';

// Global singletons
let configManager: ConfigManager | null = null;
let storageManager: StorageManager | null = null;

/**
 * Extension activation
 * Called when the extension is activated for the first time
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('[KB Extension] Activating...');

  try {
    // Initialize configuration manager
    configManager = new ConfigManager();
    await configManager.initialize(context);

    // Validate configuration
    const isValid = await configManager.validate();
    if (!isValid) {
      vscode.window.showErrorMessage(
        'KB Extension: Invalid configuration. Please check settings.'
      );
      return;
    }

    // Get configuration snapshot
    const config = await configManager.getConfigSnapshot();
    console.log('[KB Extension] Configuration loaded:', config);

    // Initialize storage manager
    storageManager = new StorageManager('', path.join(context.globalStorageUri.fsPath));
    await storageManager.initialize();

    // Verify storage health
    const isHealthy = await storageManager.isHealthy();
    if (!isHealthy) {
      vscode.window.showErrorMessage(
        'KB Extension: Failed to initialize storage layer. Please try reloading.'
      );
      return;
    }

    // Register the hello world command
    const helloWorldCommand = vscode.commands.registerCommand(
      'kb-extension.helloWorld',
      () => {
        vscode.window.showInformationMessage('Hello World from KB Extension!');
      }
    );
    context.subscriptions.push(helloWorldCommand);

    // Register configuration diagnostics command
    const diagnosticsCommand = vscode.commands.registerCommand(
      'kb-extension.showDiagnostics',
      async () => {
        const diagnostics = await configManager?.dumpConfig();
        const dbStats = await storageManager?.getDatabaseStats();
        const output = JSON.stringify({ config: diagnostics, storage: dbStats }, null, 2);
        console.log('[KB Extension] Diagnostics:', output);
        vscode.window.showInformationMessage('Diagnostics logged to console');
      }
    );
    context.subscriptions.push(diagnosticsCommand);

    // Register secret management commands
    const storeApiKeyCommand = vscode.commands.registerCommand(
      'kb-extension.storeApiKey',
      async () => {
        const apiKey = await vscode.window.showInputBox({
          prompt: 'Enter API Key for Copilot integration',
          password: true,
          ignoreFocusOut: true,
        });

        if (apiKey) {
          try {
            await configManager?.setSecret('kb-extension.copilot-api-key', apiKey);
            vscode.window.showInformationMessage('API key stored securely');
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to store API key: ${String(error)}`);
          }
        }
      }
    );
    context.subscriptions.push(storeApiKeyCommand);

    // Register config change listener
    if (configManager) {
      const listener = configManager.onConfigChange((newConfig) => {
        console.log('[KB Extension] Configuration changed:', newConfig);
        vscode.window.showInformationMessage('KB Extension configuration updated');
      });
      context.subscriptions.push(listener);
    }

    // Register KB Chat Participant for Copilot Chat (VS Code 1.116+)
    // Gracefully degrade if Chat API is not available (VS Code 1.109-1.115)
    if (typeof (vscode as any).chat?.createChatParticipant === 'function') {
      const chatParticipant = (vscode as any).chat.createChatParticipant('kb', async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
        await KBChatParticipant.handleRequest(request, context, stream, token);
      });
      chatParticipant.iconPath = new vscode.ThemeIcon('book');
      context.subscriptions.push(chatParticipant);
      console.log('[KB Extension] Chat participant registered (VS Code 1.116+)');
    } else {
      console.log('[KB Extension] Chat API not available in this VS Code version (requires 1.116+). Other features remain functional.');
    }

    vscode.window.showInformationMessage('KB Extension activated successfully!');
    console.log('[KB Extension] Activation complete');
  } catch (error) {
    console.error('[KB Extension] Activation error:', error);
    vscode.window.showErrorMessage(`KB Extension activation failed: ${String(error)}`);
  }
}

/**
 * Extension deactivation
 * Called when the extension is deactivated
 */
export async function deactivate(): Promise<void> {
  console.log('[KB Extension] Deactivating...');

  try {
    // Cleanup resources
    if (storageManager) {
      await storageManager.close();
      storageManager = null;
    }

    if (configManager) {
      configManager.dispose();
      configManager = null;
    }

    console.log('[KB Extension] Deactivation complete');
  } catch (error) {
    console.error('[KB Extension] Deactivation error:', error);
  }
}

// Provide access to singletons for testing
export function getConfigManager(): ConfigManager | null {
  return configManager;
}

export function getStorageManager(): StorageManager | null {
  return storageManager;
}
