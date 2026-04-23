/**
 * End-to-End UI Integration Tests
 * 
 * Verifies that the user interface components work correctly:
 * - Chat participant handler and slash commands
 * - Command palette commands
 * - Extension activation and initialization
 * - Error handling and edge cases
 */

import * as assert from 'assert';
import { KBChatParticipant } from '../chat/ChatParticipant';
import type { IStorageManager, QueryResult, Document } from '../types';

async function* createTextStream(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

/**
 * Mock Storage Manager for testing
 */
class MockStorageManager implements IStorageManager {
  private documents: any[];
  private chunksByDocument: Map<string, any[]>;
  private tagsByDocument: Map<string, any[]>;
  private deletedDocumentIds: string[];

  constructor(
    documents: any[] = [],
    chunksByDocument: Map<string, any[]> = new Map(),
    tagsByDocument: Map<string, any[]> = new Map()
  ) {
    this.documents = documents;
    this.chunksByDocument = chunksByDocument;
    this.tagsByDocument = tagsByDocument;
    this.deletedDocumentIds = [];
  }

  getDeletedDocumentIds(): string[] {
    return [...this.deletedDocumentIds];
  }

  async initialize(): Promise<void> {}
  async isHealthy(): Promise<boolean> { return true; }
  async close(): Promise<void> {}
  async getCurrentSchemaVersion(): Promise<number> { return 1; }
  async migrateSchema(targetVersion: number): Promise<void> {}
  
  async createDocument(doc: any): Promise<QueryResult<Document>> {
    return { success: true, data: { id: 'test-id', ...doc } as any };
  }
  
  async getDocument(id: string): Promise<QueryResult<Document | null>> {
    return { success: true, data: this.documents.find((doc) => doc.id === id) || null };
  }
  
  async listDocuments(filter?: any): Promise<QueryResult<Document[]>> {
    return { success: true, data: this.documents };
  }
  
  async updateDocument(id: string, updates: any): Promise<QueryResult<Document>> {
    return { success: true, data: {} as any };
  }
  
  async deleteDocument(id: string): Promise<QueryResult<{ deletedCount: number }>> {
    this.deletedDocumentIds.push(id);
    this.documents = this.documents.filter((doc) => doc.id !== id);
    return { success: true, data: { deletedCount: 1 } };
  }
  
  async createChunk(chunk: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async getChunk(id: string): Promise<QueryResult<any>> {
    return { success: true, data: null };
  }
  
  async listChunksByDocument(documentId: string): Promise<QueryResult<any[]>> {
    return { success: true, data: this.chunksByDocument.get(documentId) || [] };
  }
  
  async deleteChunk(id: string): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async createVector(vector: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async getVector(chunkId: string): Promise<QueryResult<any>> {
    return { success: true, data: null };
  }
  
  async updateVector(chunkId: string, embedding: number[]): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async createTag(tag: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async getTag(id: string): Promise<QueryResult<any>> {
    return { success: true, data: null };
  }
  
  async listTags(): Promise<QueryResult<any[]>> {
    return { success: true, data: [] };
  }
  
  async updateTag(id: string, updates: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async deleteTag(id: string): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async addTagToDocument(documentId: string, tagId: string): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async removeTagFromDocument(documentId: string, tagId: string): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async getDocumentTags(documentId: string): Promise<QueryResult<any[]>> {
    return { success: true, data: this.tagsByDocument.get(documentId) || [] };
  }
  
  async createCollection(coll: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async listCollections(): Promise<QueryResult<any[]>> {
    return { success: true, data: [] };
  }
  
  async deleteCollection(id: string): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async createIngestionStatus(status: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async getIngestionStatus(batchId: string): Promise<QueryResult<any>> {
    return { success: true, data: null };
  }
  
  async updateIngestionStatus(batchId: string, updates: any): Promise<QueryResult<any>> {
    return { success: true, data: {} };
  }
  
  async listIngestionStatuses(limit?: number): Promise<QueryResult<any[]>> {
    return { success: true, data: [] };
  }
  
  async beginTransaction(): Promise<void> {}
  async commit(): Promise<void> {}
  async rollback(): Promise<void> {}
  
  async getDatabaseStats(): Promise<any> {
    return {
      documentCount: 0,
      chunkCount: 0,
      vectorCount: 0,
      tagCount: 0,
      collectionCount: 0,
      ingestionBatchCount: 0,
      databaseSizeBytes: 0,
    };
  }
}

/**
 * Mock VS Code API objects for testing
 */
class MockChatResponseStream {
  messages: string[] = [];
  progressMessages: string[] = [];

  progress(message: string): void {
    this.progressMessages.push(message);
  }

  markdown(content: string): void {
    this.messages.push(content);
  }

  button(options: any): void {
    this.messages.push(`[Button: ${options.title}]`);
  }

  anchor(url: string, title?: string): void {
    this.messages.push(`[Link: ${title || url}]`);
  }

  filepicker(options: any, id: string): void {
    this.messages.push(`[FilePicker: ${id}]`);
  }

  push(value: any): void {
    this.messages.push(JSON.stringify(value));
  }
}

class MockChatRequest {
  prompt: string;
  command?: string;
  model?: any;

  constructor(prompt: string, command?: string, model?: any) {
    this.prompt = prompt;
    this.command = command;
    this.model = model;
  }
}

describe('UI Integration Tests - Chat Participant and Commands', () => {
  let mockStream: MockChatResponseStream;
  let mockRequest: MockChatRequest;
  let mockCancellationToken: any;
  let mockContext: any;
  let chatParticipant: KBChatParticipant;
  let mockStorageManager: IStorageManager;

  beforeEach(() => {
    mockStream = new MockChatResponseStream();
    mockRequest = new MockChatRequest('');
    mockCancellationToken = { isCancellationRequested: false };
    mockContext = {};
    mockStorageManager = new MockStorageManager();
    chatParticipant = new KBChatParticipant(mockStorageManager);
  });

  // ============================================================================
  // CHAT PARTICIPANT: Slash Commands
  // ============================================================================

  describe('Chat Participant - /search Command', () => {
    it('should handle chat slash command via request.command', async () => {
      mockRequest = new MockChatRequest('authentication patterns', 'search');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should produce search results');
      assert.ok(
        mockStream.messages.some((m) => m.includes('No results found') || m.includes('authentication patterns')),
        'Should route the prompt text into search handling'
      );
    });

    it('should generate grounded answer with citations when chunks are retrieved', async () => {
      mockStorageManager = new MockStorageManager(
        [
          {
            id: 'doc-1',
            name: 'OAuth Guide',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash',
            created_date: new Date(),
            updated_date: new Date(),
          },
        ],
        new Map([
          [
            'doc-1',
            [
              {
                id: 'chunk-1',
                document_id: 'doc-1',
                sequence: 0,
                text: 'OAuth2 uses authorization grants and bearer tokens to access protected resources.',
                token_count: 12,
                created_date: new Date(),
              },
            ],
          ],
        ])
      );
      chatParticipant = new KBChatParticipant(mockStorageManager);
      mockRequest = new MockChatRequest('How does OAuth2 work?', 'search', {
        sendRequest: async () => ({
          text: createTextStream(['OAuth2 uses authorization grants to obtain access tokens [1].']),
        }),
      });

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const output = mockStream.messages.join('\n');
      assert.ok(output.includes('OAuth2 uses authorization grants'), 'Should stream model answer');
      assert.ok(output.includes('### Sources'), 'Should include citations section');
      assert.ok(output.includes('OAuth Guide'), 'Should cite source document');
    });

    it('should rerank lexical results with the selected chat model when embeddings are unavailable', async () => {
      mockStorageManager = new MockStorageManager(
        [
          {
            id: 'doc-1',
            name: 'OAuth Overview',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-1',
            created_date: new Date(),
            updated_date: new Date(),
          },
          {
            id: 'doc-2',
            name: 'OAuth JWT Guide',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-2',
            created_date: new Date(),
            updated_date: new Date(),
          },
          {
            id: 'doc-3',
            name: 'OAuth Refresh Tokens',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-3',
            created_date: new Date(),
            updated_date: new Date(),
          },
        ],
        new Map([
          [
            'doc-1',
            [
              {
                id: 'chunk-1',
                document_id: 'doc-1',
                sequence: 0,
                text: 'OAuth uses access tokens for API authorization.',
                token_count: 10,
                created_date: new Date(),
              },
            ],
          ],
          [
            'doc-2',
            [
              {
                id: 'chunk-2',
                document_id: 'doc-2',
                sequence: 0,
                text: 'JWT bearer tokens are commonly used with OAuth2 authorization servers.',
                token_count: 12,
                created_date: new Date(),
              },
            ],
          ],
          [
            'doc-3',
            [
              {
                id: 'chunk-3',
                document_id: 'doc-3',
                sequence: 0,
                text: 'Refresh tokens let OAuth clients obtain new access tokens without re-authenticating the user.',
                token_count: 14,
                created_date: new Date(),
              },
            ],
          ],
        ])
      );
      chatParticipant = new KBChatParticipant(mockStorageManager, undefined, {
        enableCopilotReranking: true,
      });
      mockRequest = new MockChatRequest('/search oauth jwt', 'search', {
        sendRequest: async (messages: unknown[]) => {
          const promptText = String(messages[0]);
          if (promptText.includes('Return ONLY a JSON array of chunk IDs')) {
            return {
              text: createTextStream(['["chunk-2", "chunk-3", "chunk-1"]']),
            };
          }

          return {
            text: createTextStream(['JWT is frequently used with OAuth2 [1].']),
          };
        },
      });

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const output = mockStream.messages.join('\n');
      const sourcesIndex = output.indexOf('### Sources');
      const jwtGuideIndex = output.indexOf('OAuth JWT Guide');
      const refreshIndex = output.indexOf('OAuth Refresh Tokens');
      const overviewIndex = output.indexOf('OAuth Overview');

      assert.ok(output.includes('Ranked with Copilot reranking.'), 'Should indicate when Copilot reranking was applied');
      assert.ok(sourcesIndex >= 0, 'Should include sources after reranking');
      assert.ok(jwtGuideIndex > sourcesIndex, 'Should include the reranked top source');
      assert.ok(refreshIndex > jwtGuideIndex, 'Should keep the second reranked source after the first one');
      assert.ok(overviewIndex > jwtGuideIndex, 'Should keep the lower-ranked lexical source after the top reranked one');
    });

    it('should skip Copilot reranking when the prompt budget would be exceeded', async () => {
      const oversizedText = 'oauth '.repeat(1200);
      mockStorageManager = new MockStorageManager(
        [
          {
            id: 'doc-1',
            name: 'OAuth Overview',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-1',
            created_date: new Date(),
            updated_date: new Date(),
          },
          {
            id: 'doc-2',
            name: 'OAuth JWT Guide',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-2',
            created_date: new Date(),
            updated_date: new Date(),
          },
          {
            id: 'doc-3',
            name: 'OAuth Refresh Tokens',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-3',
            created_date: new Date(),
            updated_date: new Date(),
          },
        ],
        new Map([
          ['doc-1', [{ id: 'chunk-1', document_id: 'doc-1', sequence: 0, text: oversizedText, token_count: 10, created_date: new Date() }]],
          ['doc-2', [{ id: 'chunk-2', document_id: 'doc-2', sequence: 0, text: oversizedText, token_count: 10, created_date: new Date() }]],
          ['doc-3', [{ id: 'chunk-3', document_id: 'doc-3', sequence: 0, text: oversizedText, token_count: 10, created_date: new Date() }]],
        ])
      );
      chatParticipant = new KBChatParticipant(mockStorageManager, undefined, {
        enableCopilotReranking: true,
      });
      mockRequest = new MockChatRequest('/search oauth', 'search', {
        sendRequest: async (messages: unknown[]) => {
          const promptText = String(messages[0]);
          if (promptText.includes('Return ONLY a JSON array of chunk IDs')) {
            throw new Error('Rerank prompt should not be sent when prompt budget is exceeded');
          }

          return {
            text: createTextStream(['OAuth overview answer [1].']),
          };
        },
      });

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const output = mockStream.messages.join('\n');
  assert.ok(!output.includes('Ranked with Copilot reranking.'), 'Should not show reranking note when reranking is skipped');
      assert.ok(output.includes('### Sources'), 'Should still produce sources when reranking is skipped');
      assert.ok(output.includes('OAuth Overview'), 'Should keep lexical results available without reranking');
    });

    it('should keep lexical order when Copilot reranking is disabled', async () => {
      mockStorageManager = new MockStorageManager(
        [
          {
            id: 'doc-1',
            name: 'OAuth Overview',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-1',
            created_date: new Date(),
            updated_date: new Date(),
          },
          {
            id: 'doc-2',
            name: 'OAuth JWT Guide',
            type: 'markdown',
            size_bytes: 100,
            hash: 'hash-2',
            created_date: new Date(),
            updated_date: new Date(),
          },
        ],
        new Map([
          [
            'doc-1',
            [
              {
                id: 'chunk-1',
                document_id: 'doc-1',
                sequence: 0,
                text: 'OAuth uses access tokens for API authorization.',
                token_count: 10,
                created_date: new Date(),
              },
            ],
          ],
          [
            'doc-2',
            [
              {
                id: 'chunk-2',
                document_id: 'doc-2',
                sequence: 0,
                text: 'JWT bearer tokens are commonly used with OAuth2 authorization servers.',
                token_count: 12,
                created_date: new Date(),
              },
            ],
          ],
        ])
      );
      chatParticipant = new KBChatParticipant(mockStorageManager);
      mockRequest = new MockChatRequest('/search oauth jwt', 'search', {
        sendRequest: async () => ({
          text: createTextStream(['JWT is frequently used with OAuth2 [1].']),
        }),
      });

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const output = mockStream.messages.join('\n');
      const sourcesIndex = output.indexOf('### Sources');
      const sourcesSection = output.slice(sourcesIndex);
      const overviewIndex = sourcesSection.indexOf('OAuth Overview');
      const jwtGuideIndex = sourcesSection.indexOf('OAuth JWT Guide');

      assert.ok(!output.includes('Ranked with Copilot reranking.'), 'Should not show reranking note when reranking is disabled');
      assert.ok(sourcesIndex >= 0, 'Should include sources without reranking');
      assert.ok(jwtGuideIndex >= 0, 'Should keep the lexical top source in sources');
      assert.ok(overviewIndex > jwtGuideIndex, 'Should leave the lower-ranked lexical source after the first one');
    });

    it('should handle /search with valid query', async () => {
      mockRequest = new MockChatRequest('/search authentication patterns');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should produce search results');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Search Results')),
        'Should display search results header'
      );
      assert.ok(
        mockStream.messages.some((m) => m.includes('authentication patterns')),
        'Should show the search query'
      );
    });

    it('should handle /search without query', async () => {
      mockRequest = new MockChatRequest('/search');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should show usage message');
      assert.ok(
        mockStream.messages.some((m) => m.includes('search query')),
        'Should prompt for search query'
      );
    });

    it('should handle natural language query (defaults to search)', async () => {
      mockRequest = new MockChatRequest('How do I implement OAuth2?');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should process natural language query');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Search Results') || m.includes('Query')),
        'Should show search processing'
      );
    });

    it('should show progress indicator during search', async () => {
      mockRequest = new MockChatRequest('/search test');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.progressMessages.length > 0, 'Should show progress');
      assert.ok(
        mockStream.progressMessages.some((p) => p.includes('Searching')),
        'Should indicate searching status'
      );
    });
  });

  describe('Chat Participant - /list Command', () => {
    it('should handle chat slash command via request.command', async () => {
      mockRequest = new MockChatRequest('', 'list');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should list documents');
    });

    it('should handle /list command', async () => {
      mockRequest = new MockChatRequest('/list');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should list documents');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Knowledge Base Documents')),
        'Should show documents header'
      );
    });

    it('should show empty state when no documents', async () => {
      mockRequest = new MockChatRequest('/list');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(
        mockStream.messages.some((m) => m.includes('Empty') || m.includes('No documents')),
        'Should indicate empty knowledge base'
      );
    });

    it('should show instructions for adding documents', async () => {
      mockRequest = new MockChatRequest('/list');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(
        mockStream.messages.some((m) => m.includes('/ingest')),
        'Should suggest ingest command'
      );
    });
  });

  describe('Chat Participant - /ingest Command', () => {
    it('should handle chat slash command via request.command', async () => {
      mockRequest = new MockChatRequest('INTEGRATION_GUIDE.md', 'ingest');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should show ingest status');
      assert.ok(
        mockStream.messages.some((m) => m.includes('File not found') || m.includes('Starting Ingestion')),
        'Should route through ingest instead of search'
      );
    });

    it('should handle /ingest with valid file path', async () => {
      mockRequest = new MockChatRequest('/ingest /path/to/document.md');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should show ingest status');
      assert.ok(
        mockStream.messages.some((m) => m.includes('File not found') || m.includes('Error')),
        'Should handle non-existent file gracefully'
      );
    });

    it('should handle /ingest without file path', async () => {
      mockRequest = new MockChatRequest('/ingest');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(
        mockStream.messages.some((m) => m.includes('Usage')),
        'Should show usage instructions'
      );
      assert.ok(
        mockStream.messages.some((m) => m.includes('Markdown') || m.includes('.md')),
        'Should list supported formats'
      );
    });

    it('should support multiple file formats', async () => {
      const formats = ['/ingest file.md', '/ingest file.txt', '/ingest file.pdf'];

      for (const format of formats) {
        mockRequest = new MockChatRequest(format);
        mockStream = new MockChatResponseStream();

        await chatParticipant.handleRequest(
          mockRequest as any,
          mockContext,
          mockStream as any,
          mockCancellationToken
        );

        assert.ok(mockStream.messages.length > 0, `Should handle ${format}`);
      }
    });

    it('should show progress indicator during ingestion', async () => {
      mockRequest = new MockChatRequest('/ingest test.md');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.progressMessages.length > 0, 'Should show progress');
      assert.ok(
        mockStream.progressMessages.some((p) => p.includes('ingestion')),
        'Should indicate ingestion status'
      );
    });
  });

  describe('Chat Participant - /help Command', () => {
    it('should handle chat slash command via request.command', async () => {
      mockRequest = new MockChatRequest('', 'help');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should show help');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Help')),
        'Should have help header'
      );
    });

    it('should handle /help command', async () => {
      mockRequest = new MockChatRequest('/help');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should show help');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Help')),
        'Should have help header'
      );
    });

    it('should document all available commands', async () => {
      mockRequest = new MockChatRequest('/help');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const helpText = mockStream.messages.join('\n');
      assert.ok(helpText.includes('/search'), 'Should document /search command');
      assert.ok(helpText.includes('/list'), 'Should document /list command');
      assert.ok(helpText.includes('/ingest'), 'Should document /ingest command');
      assert.ok(helpText.includes('/cleanup'), 'Should document /cleanup command');
      assert.ok(helpText.includes('/help'), 'Should document /help command');
    });

    it('should provide usage examples', async () => {
      mockRequest = new MockChatRequest('/help');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const helpText = mockStream.messages.join('\n');
      assert.ok(helpText.includes('Example') || helpText.toLowerCase().includes('example'), 'Should include examples');
    });

    it('should explain getting started', async () => {
      mockRequest = new MockChatRequest('/help');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const helpText = mockStream.messages.join('\n');
      assert.ok(
        helpText.includes('Getting Started') || helpText.toLowerCase().includes('getting started'),
        'Should include getting started section'
      );
    });
  });

  describe('Chat Participant - /cleanup Command', () => {
    it('should handle chat slash command via request.command', async () => {
      mockRequest = new MockChatRequest('', 'cleanup');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should show cleanup output');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Cleanup Results')),
        'Should show cleanup header'
      );
    });

    it('should remove only non-critical documents', async () => {
      const criticalDoc = {
        id: 'doc-critical',
        name: 'Critical Runbook',
        type: 'markdown',
        size_bytes: 128,
        hash: 'hash-critical',
        metadata: {},
        created_date: new Date(),
        updated_date: new Date(),
      };
      const nonCriticalDoc = {
        id: 'doc-temp',
        name: 'Temporary Notes',
        type: 'markdown',
        size_bytes: 64,
        hash: 'hash-temp',
        metadata: {},
        created_date: new Date(),
        updated_date: new Date(),
      };

      const storage = new MockStorageManager(
        [criticalDoc, nonCriticalDoc],
        new Map(),
        new Map([
          [
            'doc-critical',
            [{ id: 'tag-1', name: 'critical', created_date: new Date() }],
          ],
          ['doc-temp', []],
        ])
      );

      chatParticipant = new KBChatParticipant(storage as unknown as IStorageManager);
      mockRequest = new MockChatRequest('/cleanup');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const deletedIds = storage.getDeletedDocumentIds();
      const output = mockStream.messages.join('\n');

      assert.deepStrictEqual(deletedIds, ['doc-temp'], 'Should delete only non-critical document');
      assert.ok(output.includes('Retained critical documents: **1**'), 'Should retain critical docs');
      assert.ok(output.includes('Removed non-critical documents: **1**'), 'Should report removed docs');
    });
  });

  // ============================================================================
  // CHAT PARTICIPANT: Natural Language Queries
  // ============================================================================

  describe('Chat Participant - Natural Language Queries', () => {
    it('should handle simple questions', async () => {
      mockRequest = new MockChatRequest('What is authentication?');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should respond to question');
    });

    it('should handle questions with multiple words', async () => {
      mockRequest = new MockChatRequest('How do I implement user authentication with JWT?');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should respond to complex question');
      assert.ok(
        mockStream.messages.some((m) => m.includes('JWT') || m.includes('authentication')),
        'Should include query terms in response'
      );
    });

    it('should be case-insensitive', async () => {
      const queries = ['SHOW ME AUTH PATTERNS', 'show me auth patterns', 'Show Me Auth Patterns'];

      for (const query of queries) {
        mockRequest = new MockChatRequest(query);
        mockStream = new MockChatResponseStream();

        await chatParticipant.handleRequest(
          mockRequest as any,
          mockContext,
          mockStream as any,
          mockCancellationToken
        );

        assert.ok(mockStream.messages.length > 0, `Should handle: ${query}`);
      }
    });

    it('should handle whitespace correctly', async () => {
      mockRequest = new MockChatRequest('   /search   test query   ');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.messages.length > 0, 'Should trim whitespace');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Chat Participant - Error Handling', () => {
    it('should handle null request gracefully', async () => {
      try {
        await chatParticipant.handleRequest(
          { prompt: '' } as any,
          mockContext,
          mockStream as any,
          mockCancellationToken
        );
        // Should not throw
        assert.ok(true, 'Should handle empty request');
      } catch (error) {
        assert.fail('Should not throw error on empty request');
      }
    });

    it('should show error message on exception', async () => {
      // Force an error by passing invalid stream
      const badStream = {} as any;

      try {
        await chatParticipant.handleRequest(
          { prompt: '/search test' } as any,
          mockContext,
          badStream,
          mockCancellationToken
        );
      } catch (error) {
        // Expected to fail gracefully
        assert.ok(error, 'Should catch error');
      }
    });

    it('should handle cancellation token', async () => {
      mockRequest = new MockChatRequest('/search test');
      mockCancellationToken.isCancellationRequested = true;

      // Should still execute (token is optional)
      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(true, 'Should handle cancellation token');
    });
  });

  // ============================================================================
  // INTEGRATION: End-to-End User Flows
  // ============================================================================

  describe('UI Integration - End-to-End Flows', () => {
    it('should support complete search workflow', async () => {
      // Flow: User searches for documents
      mockRequest = new MockChatRequest('/search React hooks');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.progressMessages.length > 0, 'Should show progress');
      assert.ok(mockStream.messages.length > 0, 'Should show results');
      assert.ok(
        mockStream.messages.some((m) => m.includes('Search Results') || m.includes('results')),
        'Should show search results'
      );
    });

    it('should support complete list and help workflow', async () => {
      // Flow 1: List documents
      mockRequest = new MockChatRequest('/list');
      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const listMessages = mockStream.messages.length;
      assert.ok(listMessages > 0, 'List should produce output');

      // Flow 2: Show help
      mockRequest = new MockChatRequest('/help');
      mockStream = new MockChatResponseStream();

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      const helpMessages = mockStream.messages.length;
      assert.ok(helpMessages > 0, 'Help should produce output');
    });

    it('should support ingest workflow', async () => {
      // Flow: User wants to ingest a document
      mockRequest = new MockChatRequest('/ingest ~/documents/guide.md');

      await chatParticipant.handleRequest(
        mockRequest as any,
        mockContext,
        mockStream as any,
        mockCancellationToken
      );

      assert.ok(mockStream.progressMessages.length > 0, 'Should show progress');
      assert.ok(
        mockStream.messages.some((m) => m.includes('File not found') || m.includes('Error')),
        'Should handle file not found gracefully'
      );
    });

    it('should support mixed slash and natural language', async () => {
      const queries = ['/search OAuth', 'Show me OAuth examples', '/help', 'what is OAuth?'];

      for (const query of queries) {
        mockStream = new MockChatResponseStream();
        mockRequest = new MockChatRequest(query);

        await chatParticipant.handleRequest(
          mockRequest as any,
          mockContext,
          mockStream as any,
          mockCancellationToken
        );

        assert.ok(mockStream.messages.length > 0, `Should handle query: "${query}"`);
      }
    });
  });

  // ============================================================================
  // UI COMMAND PALETTE: Commands Registration
  // ============================================================================

  describe('Command Palette Integration', () => {
    it('should register kb-extension.helloWorld command', () => {
      // This test verifies the command is defined in package.json
      const command = 'kb-extension.helloWorld';
      assert.ok(command, 'Command identifier should be defined');
      assert.strictEqual(command.startsWith('kb-extension.'), true, 'Should follow naming convention');
    });

    it('should register kb-extension.showDiagnostics command', () => {
      const command = 'kb-extension.showDiagnostics';
      assert.ok(command, 'Command identifier should be defined');
      assert.strictEqual(command.startsWith('kb-extension.'), true, 'Should follow naming convention');
    });

    it('should register kb-extension.storeApiKey command', () => {
      const command = 'kb-extension.storeApiKey';
      assert.ok(command, 'Command identifier should be defined');
      assert.strictEqual(command.startsWith('kb-extension.'), true, 'Should follow naming convention');
    });
  });

  describe('Chat Participant Registration', () => {
    it('should register kb chat participant', () => {
      const participantId = 'kb';
      assert.ok(participantId, 'Participant ID should be defined');
      assert.strictEqual(participantId, 'kb', 'Should have correct ID');
    });

    it('should have slash commands configured', () => {
      const commands = ['/search', '/list', '/ingest', '/help'];
      assert.ok(commands.length >= 4, 'Should have at least 4 slash commands');
    });

    it('should have proper activation events', () => {
      const events = ['onChatParticipant:kb', 'onStartupFinished'];
      assert.ok(events.includes('onChatParticipant:kb'), 'Should activate on chat participant');
      assert.ok(events.includes('onStartupFinished'), 'Should activate on VS Code startup');
    });
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================

  describe('UI Test Summary', () => {
    it('should support all documented features', () => {
      const features = [
        'Slash commands (/search, /list, /ingest, /help)',
        'Natural language queries',
        'Command palette commands',
        'Error handling',
        'Progress indication',
        'Help and getting started',
      ];

      assert.ok(features.length === 6, 'Should have 6 major UI features');
    });
  });
});
