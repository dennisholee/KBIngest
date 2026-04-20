/**
 * KB Chat Participant Handler
 * 
 * Handles user interactions with the KB participant in VS Code's Copilot Chat.
 * Provides slash commands and natural language queries for knowledge base operations.
 */

import * as vscode from 'vscode';

export class KBChatParticipant {
  /**
   * Handle chat requests from Copilot Chat interface
   */
  static async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      const prompt = request.prompt.trim().toLowerCase();

      // Handle slash commands
      if (prompt.startsWith('/search')) {
        await KBChatParticipant.handleSearch(request, stream, token);
      } else if (prompt.startsWith('/list')) {
        await KBChatParticipant.handleList(request, stream, token);
      } else if (prompt.startsWith('/ingest')) {
        await KBChatParticipant.handleIngest(request, stream, token);
      } else if (prompt.startsWith('/help')) {
        await KBChatParticipant.handleHelp(stream);
      } else {
        // Natural language query - default to search
        await KBChatParticipant.handleSearch(request, stream, token);
      }
    } catch (error) {
      stream.markdown(`Error processing request: ${String(error)}`);
      console.error('[KB Chat] Error:', error);
    }
  }

  /**
   * Handle /search command
   */
  private static async handleSearch(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Searching knowledge base...');

    // Extract search query
    const query = request.prompt.replace(/^\/search\s*/i, '').trim();

    if (!query) {
      stream.markdown('Please provide a search query. Example: `/search how to implement authentication`');
      return;
    }

    // Simulate search results
    stream.markdown('### Search Results\n\n');
    stream.markdown(`**Query:** "${query}"\n\n`);
    stream.markdown('**Results:**\n');
    stream.markdown('- Document 1: Authentication Best Practices\n');
    stream.markdown('- Document 2: Security Implementation Guide\n');
    stream.markdown('- Document 3: OAuth2 Integration Tutorial\n\n');
    stream.markdown('*Search completed. Add documents to your knowledge base for real results.*');
  }

  /**
   * Handle /list command
   */
  private static async handleList(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Listing knowledge base documents...');

    stream.markdown('### Knowledge Base Documents\n\n');
    stream.markdown('No documents currently in knowledge base.\n\n');
    stream.markdown('**To add documents:**\n');
    stream.markdown('1. Use `/ingest` command with file path\n');
    stream.markdown('2. Or use VS Code command: `kb-extension.storeApiKey`\n');
    stream.markdown('3. Then run: `kb-extension.showDiagnostics`');
  }

  /**
   * Handle /ingest command
   */
  private static async handleIngest(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Preparing document ingestion...');

    const filePath = request.prompt.replace(/^\/ingest\s*/i, '').trim();

    if (!filePath) {
      stream.markdown('Usage: `/ingest <file-path>`\n\n');
      stream.markdown('Supported formats:\n');
      stream.markdown('- Markdown (.md)\n');
      stream.markdown('- Plain text (.txt)\n');
      stream.markdown('- PDF (.pdf)\n\n');
      stream.markdown('Example: `/ingest /path/to/document.md`');
      return;
    }

    stream.markdown(`### Document Ingestion\n\n`);
    stream.markdown(`**File:** \`${filePath}\`\n\n`);
    stream.markdown('**Status:** Ready to ingest\n\n');
    stream.markdown('*To ingest documents:*\n');
    stream.markdown('1. Configure storage path in VS Code Settings\n');
    stream.markdown('2. Use the DocumentIngestionService API\n');
    stream.markdown('3. Results will be stored and indexed');
  }

  /**
   * Handle /help command
   */
  private static async handleHelp(stream: vscode.ChatResponseStream): Promise<void> {
    stream.markdown('# KB Extension Help\n\n');
    stream.markdown('## Available Commands\n\n');
    stream.markdown('### `/search <query>`\n');
    stream.markdown('Search your knowledge base for documents matching the query.\n\n');
    stream.markdown('Example: `/search authentication patterns`\n\n');
    stream.markdown('### `/list`\n');
    stream.markdown('List all documents currently in your knowledge base.\n\n');
    stream.markdown('### `/ingest <file-path>`\n');
    stream.markdown('Add a document to your knowledge base.\n\n');
    stream.markdown('Example: `/ingest ~/documents/api-guide.md`\n\n');
    stream.markdown('### `/help`\n');
    stream.markdown('Show this help message.\n\n');
    stream.markdown('## Natural Language\n\n');
    stream.markdown('You can also use natural language queries:\n\n');
    stream.markdown('> "How do I authenticate users?"\n\n');
    stream.markdown('> "Show me security best practices"\n\n');
    stream.markdown('## Getting Started\n\n');
    stream.markdown('1. Configure KB Extension in VS Code Settings (⌘,)\n');
    stream.markdown('2. Add documents using `/ingest` command\n');
    stream.markdown('3. Search your knowledge base using `/search` or natural language\n');
  }
}
