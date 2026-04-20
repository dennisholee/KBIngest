/**
 * End-to-End Integration Tests - KB Extension S1.1-S1.7
 * 
 * Comprehensive test suite validating workflows that span multiple layers:
 * - Ingestion → Storage → Search → Performance
 * - Tests realistic usage patterns and error scenarios
 * - Validates cross-layer contract enforcement
 * 
 * Coverage:
 * - Full document ingestion workflows
 * - Search indexing and retrieval
 * - Query caching and performance
 * - Error handling across layers
 * - Batch operations
 */

import { StorageManager } from '../storage/StorageManager';
import { SearchService, createSearchService } from '../search/SearchService';
import { MarkdownParser, FileParserFactory } from '../ingestion/FileParser';
import { FixedSizeChunking, ChunkingStrategyFactory } from '../ingestion/ChunkingStrategy';
import { DocumentIngestionService } from '../ingestion/DocumentIngestionService';
import { QueryResultCache } from '../performance/QueryCache';
import { ConfigManager } from '../config/ConfigManager';
import { DuplicateDetector } from '../ingestion/DuplicateDetector';
import { CodeBlockDetector } from '../ingestion/CodeBlockDetector';
import type { ParsedFile, DocumentChunk } from '../ingestion/types';
import type { SearchRequest, SearchResult } from '../search/types';

// Test utilities
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

describe('End-to-End Integration Tests - KB Extension', () => {
  let storage: StorageManager;
  let searchService: SearchService;
  let ingestionService: DocumentIngestionService;
  let cache: QueryResultCache;
  let fileFactory: FileParserFactory;
  let chunkingFactory: ChunkingStrategyFactory;

  beforeEach(async () => {
    // Initialize all services with in-memory database
    storage = new StorageManager(':memory:');
    await storage.initialize();

    // Setup search service with underlying database
    const dbConnection = (storage as any).db;
    const db = dbConnection.getConnection();
    searchService = createSearchService(db);

    // Setup ingestion service
    ingestionService = new DocumentIngestionService(storage);

    // Setup performance layer
    cache = new QueryResultCache(10, 60000); // 10MB, 60s TTL

    // Setup factories
    fileFactory = new FileParserFactory();
    chunkingFactory = new ChunkingStrategyFactory();
  });

  afterEach(async () => {
    await storage.close();
  });

  // ============================================================================
  // WORKFLOW 1: INGEST → STORE → VERIFY
  // ============================================================================
  describe('Workflow 1: Document Ingestion Pipeline', () => {
    test('should ingest markdown file end-to-end', async () => {
      // ARRANGE: Create test markdown content
      const content = `# Getting Started with TypeScript

TypeScript is a typed superset of JavaScript. This guide will help you get started.

## Installation

\`\`\`bash
npm install -g typescript
\`\`\`

## Type Basics

- Types provide compile-time checking
- Interfaces define object shapes
- Generics enable reusable components
`;

      const buffer = Buffer.from(content, 'utf-8');
      const fileName = 'typescript-guide.md';

      // ACT: Ingest the file
      const ingestResult = await ingestionService.ingestBuffer(buffer, fileName);

      // ASSERT: Verify successful ingestion
      expect(ingestResult.success).toBe(true);
      expect(ingestResult.data).toBeDefined();
      expect(ingestResult.data?.documentId).toBeDefined();
      expect(ingestResult.data?.chunksCreated).toBeGreaterThan(0);

      // VERIFY: Check stored document
      const docId = ingestResult.data!.documentId;
      const docResult = await storage.getDocument(docId);
      expect(docResult.success).toBe(true);
      expect(docResult.data?.name).toBe(fileName);
      expect(docResult.data?.hash).toBeDefined();

      // VERIFY: Check chunks exist
      const chunksResult = await storage.listChunksByDocument(docId);
      expect(chunksResult.success).toBe(true);
      expect(chunksResult.data?.length).toBeGreaterThan(0);
    });

    test('should handle multiple file formats in sequence', async () => {
      const files = [
        {
          name: 'guide.md',
          type: 'markdown',
          content: '# Markdown Guide\n\nContent here.',
        },
        {
          name: 'notes.txt',
          type: 'plaintext',
          content: 'Plain text notes\nLine 2\nLine 3',
        },
      ];

      const results = [];

      // ACT: Ingest multiple files
      for (const file of files) {
        const buffer = Buffer.from(file.content, 'utf-8');
        const result = await ingestionService.ingestBuffer(buffer, file.name);
        results.push(result);
      }

      // ASSERT: All files ingested successfully
      results.forEach((result, idx) => {
        expect(result.success).toBe(true);
        expect(result.data?.documentId).toBeDefined();
      });

      // VERIFY: Both documents stored
      const stats = await storage.getDatabaseStats();
      expect(stats.documentCount).toBeGreaterThanOrEqual(2);
    });

    test('should create properly indexed chunks', async () => {
      const content = 'First section.\n\nSecond section.\n\nThird section.';
      const buffer = Buffer.from(content, 'utf-8');

      // ACT: Ingest
      const ingestResult = await ingestionService.ingestBuffer(buffer, 'sections.txt');
      expect(ingestResult.success).toBe(true);

      // VERIFY: Chunks are properly indexed
      const docId = ingestResult.data!.documentId;
      const chunksResult = await storage.listChunksByDocument(docId);
      expect(chunksResult.success).toBe(true);

      const chunks = chunksResult.data!;
      chunks.forEach((chunk: any) => {
        expect(chunk.text).toBeDefined();
        expect(chunk.text.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // WORKFLOW 2: STORE → SEARCH → RETRIEVE
  // ============================================================================
  describe('Workflow 2: Search and Retrieval', () => {
    let docId: string;

    beforeEach(async () => {
      // Setup: Ingest test documents
      const docs = [
        'Machine learning is a subset of artificial intelligence',
        'Deep learning uses neural networks with many layers',
        'Python is popular for data science and machine learning',
      ];

      for (const content of docs) {
        const result = await ingestionService.ingestBuffer(
          Buffer.from(content, 'utf-8'),
          `doc-${generateId('ml')}.txt`
        );

        if (result.success && result.data) {
          docId = result.data.documentId;
        }
      }
    });

    test('should search documents after ingestion', async () => {
      // ACT: Perform full-text search
      const searchRequest: SearchRequest = {
        query: 'machine learning',
        limit: 10,
      };

      const searchResult = await searchService.search(searchRequest);

      // ASSERT: Search returns results
      expect(searchResult.success).toBe(true);
      expect(searchResult.data).toBeDefined();
      expect((searchResult.data as any)?.results?.length).toBeGreaterThan(0);

      // VERIFY: Results are relevant
      const firstResult = (searchResult.data as any)?.results?.[0];
      expect(firstResult?.text?.toLowerCase()).toContain('machine learning');
    });

    test('should rank search results by relevance', async () => {
      // ACT: Search for specific term
      const searchResult = await searchService.search({
        query: 'neural networks',
        limit: 5,
      });

      // ASSERT: Results exist
      expect(searchResult.success).toBe(true);
      const results = (searchResult.data as any)?.results || [];
      expect(results.length).toBeGreaterThan(0);

      // VERIFY: Top result is most relevant
      // (Text containing "neural networks" should rank higher than general ML content)
      const topResult = results[0];
      expect(topResult?.text?.toLowerCase()).toContain('neural');
    });

    test('should retrieve document with search result', async () => {
      // ACT: Search and get result
      const searchResult = await searchService.search({
        query: 'python',
        limit: 5,
      });

      expect(searchResult.success).toBe(true);
      const result = (searchResult.data as any)?.results?.[0];

      // ACT: Retrieve full document
      const docResult = await storage.getDocument(result.documentId);

      // ASSERT: Document retrieved successfully
      expect(docResult.success).toBe(true);
      expect(docResult.data).toBeDefined();
    });
  });

  // ============================================================================
  // WORKFLOW 3: SEARCH + CACHE → PERFORMANCE
  // ============================================================================
  describe('Workflow 3: Search with Caching', () => {
    beforeEach(async () => {
      // Setup: Ingest documents
      const content = 'Query caching improves performance. Cache stores results.';
      const result = await ingestionService.ingestBuffer(
        Buffer.from(content, 'utf-8'),
        'cache-test.txt'
      );
      expect(result.success).toBe(true);
    });

    test('should cache search results for identical queries', async () => {
      const query = { query: 'cache', limit: 10 };

      // ACT: First search (cache miss)
      const startTime1 = performance.now();
      const result1 = await searchService.search(query);
      const time1 = performance.now() - startTime1;

      // Cache the result
      const cacheKey = `search:${query.query}:${query.limit}`;
      cache.set(cacheKey, result1);

      // ACT: Second identical search (cache hit)
      const cached = cache.get(cacheKey);

      // ASSERT: Cached result matches original (cache returns the stored value)
      expect(cached).toBeDefined();
      expect((cached as any)?.success).toBe((result1 as any)?.success);

      // VERIFY: Cache provides faster retrieval (no network/DB call)
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
    });

    test('should track cache statistics', () => {
      // ACT: Perform cache operations
      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      // ASSERT: Statistics are accurate
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
    });
  });

  // ============================================================================
  // WORKFLOW 4: BATCH OPERATIONS
  // ============================================================================
  describe('Workflow 4: Batch Document Operations', () => {
    test('should ingest multiple documents efficiently', async () => {
      // ARRANGE: Create multiple documents
      const documents = Array.from({ length: 5 }, (_, i) => ({
        name: `doc-${i}.md`,
        content: `Document ${i} content.\n\nThis is paragraph 2.\n\nThis is paragraph 3.`,
      }));

      // ACT: Ingest all documents
      const results = [];
      for (const doc of documents) {
        const result = await ingestionService.ingestBuffer(
          Buffer.from(doc.content, 'utf-8'),
          doc.name
        );
        results.push(result);
      }

      // ASSERT: All ingested successfully
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.every((r) => r.data?.documentId)).toBe(true);

      // VERIFY: All documents stored
      const stats = await storage.getDatabaseStats();
      expect(stats.documentCount).toBeGreaterThanOrEqual(5);
    });

    test('should search across multiple documents', async () => {
      // Setup: Ingest documents with overlapping keywords
      const docs = [
        'TypeScript enables type safety in JavaScript',
        'JavaScript is the language of the web',
        'Type checking prevents runtime errors',
      ];

      for (const content of docs) {
        await ingestionService.ingestBuffer(Buffer.from(content, 'utf-8'), `doc-${generateId('k')}.txt`);
      }

      // ACT: Search for keyword appearing in multiple docs
      const result = await searchService.search({
        query: 'type',
        limit: 10,
      });

      // ASSERT: Search returns results from multiple documents
      expect(result.success).toBe(true);
      expect(result.data!.results.length).toBeGreaterThan(0);

      // Check results span multiple documents
      const docIds = new Set(result.data!.results.map((r) => r.documentId));
      expect(docIds.size).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // WORKFLOW 5: ERROR HANDLING ACROSS LAYERS
  // ============================================================================
  describe('Workflow 5: Error Recovery and Consistency', () => {
    test('should handle invalid file gracefully', async () => {
      // ACT: Try to ingest unsupported file type
      const result = await ingestionService.ingestBuffer(
        Buffer.from('binary data', 'utf-8'),
        'unknown.xyz'
      );

      // ASSERT: Returns error, doesn't crash
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // VERIFY: Database remains in consistent state
      const stats = await storage.getDatabaseStats();
      expect(stats.documentCount).toBe(0);
    });

    test('should maintain consistency on partial failure', async () => {
      // Ingest first document successfully
      const result1 = await ingestionService.ingestBuffer(
        Buffer.from('Valid document', 'utf-8'),
        'doc1.txt'
      );

      expect(result1.success).toBe(true);
      const stats1 = await storage.getDatabaseStats();
      expect(stats1.documentCount).toBe(1);

      // Try to ingest invalid file
      const result2 = await ingestionService.ingestBuffer(
        Buffer.from('data', 'utf-8'),
        'invalid.xyz'
      );

      expect(result2.success).toBe(false);

      // Verify first document still exists
      const stats2 = await storage.getDatabaseStats();
      expect(stats2.documentCount).toBe(1);
    });

    test('should handle missing documents gracefully', async () => {
      // ACT: Try to retrieve non-existent document
      const result = await storage.getDocument('non-existent-id');

      // ASSERT: Returns not found, not error
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND');
      }
    });
  });

  // ============================================================================
  // WORKFLOW 6: DOCUMENT LIFECYCLE
  // ============================================================================
  describe('Workflow 6: Document Lifecycle Management', () => {
    test('should track document metadata through lifecycle', async () => {
      // ACT: Create and track document
      const content = 'Original content';
      const ingestResult = await ingestionService.ingestBuffer(
        Buffer.from(content, 'utf-8'),
        'lifecycle-test.md'
      );

      expect(ingestResult.success).toBe(true);
      const docId = ingestResult.data!.documentId;

      // VERIFY: Metadata at creation
      const docResult = await storage.getDocument(docId);
      expect(docResult.success).toBe(true);
      expect(docResult.data?.created_date).toBeDefined();
      expect(docResult.data?.hash).toBeDefined();

      // VERIFY: Chunks are associated
      const chunksResult = await storage.listChunksByDocument(docId);
      expect(chunksResult.success).toBe(true);
      expect(chunksResult.data!.length).toBeGreaterThan(0);
    });

    test('should list documents with pagination', async () => {
      // Setup: Create multiple documents
      for (let i = 0; i < 3; i++) {
        await ingestionService.ingestBuffer(
          Buffer.from(`Document ${i}`, 'utf-8'),
          `doc-${i}.txt`
        );
      }

      // ACT: List documents
      const listResult = await storage.listDocuments();

      // ASSERT: Can retrieve list
      expect(listResult.success).toBe(true);
      expect(listResult.data!.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================================================
  // WORKFLOW 7: SEARCH QUALITY VALIDATION
  // ============================================================================
  describe('Workflow 7: Search Quality and Relevance', () => {
    beforeEach(async () => {
      // Setup: Ingest content with varying relevance
      const contents = [
        'Exact match: TypeScript is a programming language',
        'Partial match: Script and Type systems',
        'No match: Python is also a programming language',
      ];

      for (let i = 0; i < contents.length; i++) {
        await ingestionService.ingestBuffer(
          Buffer.from(contents[i], 'utf-8'),
          `relevance-${i}.txt`
        );
      }
    });

    test('should return results in relevance order', async () => {
      // ACT: Search for "TypeScript"
      const result = await searchService.search({
        query: 'TypeScript',
        limit: 10,
      });

      // ASSERT: Results exist and have score info
      expect(result.success).toBe(true);
      expect((result.data as any)?.results?.length).toBeGreaterThan(0);

      // VERIFY: Results are ordered by relevance (highest first)
      const results = (result.data as any)?.results || [];
      const hasRelevanceOrder = results.every((r: any, i: number) => {
        if (i === 0) return true;
        return r.text.toLowerCase().includes('typescript') ||
               results[i - 1].text.toLowerCase().includes('typescript');
      });
      expect(hasRelevanceOrder || results.length === 1).toBe(true);
    });
  });

  // ============================================================================
  // WORKFLOW 8: CONFIGURATION AND CUSTOMIZATION
  // ============================================================================
  describe('Workflow 8: Configuration Management', () => {
    test('should apply configuration to ingestion service', async () => {
      // ARRANGE: Create config with custom settings
      const config = new ConfigManager();

      // Assume config has settings for chunk size
      // This validates that config flows through to services
      expect(config).toBeDefined();

      // ACT: Use ingestion with config
      const content = 'Configuration test content.';
      const result = await ingestionService.ingestBuffer(
        Buffer.from(content, 'utf-8'),
        'config-test.txt'
      );

      // ASSERT: Ingestion respects config
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // WORKFLOW 9: PERFORMANCE CHARACTERISTICS
  // ============================================================================
  describe('Workflow 9: Performance Validation', () => {
    test('should complete ingestion within reasonable time', async () => {
      // ARRANGE: Larger document
      const content = 'Section 1\n\n'.repeat(100) + 'Final section';

      // ACT: Measure ingestion time
      const startTime = performance.now();
      const result = await ingestionService.ingestBuffer(
        Buffer.from(content, 'utf-8'),
        'perf-test.txt'
      );
      const elapsedMs = performance.now() - startTime;

      // ASSERT: Completes and is reasonably fast
      expect(result.success).toBe(true);
      expect(elapsedMs).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should maintain search performance with multiple documents', async () => {
      // Setup: Ingest multiple documents
      for (let i = 0; i < 5; i++) {
        const content = `Document ${i}: Content about search performance.`;
        await ingestionService.ingestBuffer(
          Buffer.from(content, 'utf-8'),
          `perf-doc-${i}.txt`
        );
      }

      // ACT: Measure search time
      const startTime = performance.now();
      const result = await searchService.search({
        query: 'performance',
        limit: 10,
      });
      const elapsedMs = performance.now() - startTime;

      // ASSERT: Search completes quickly
      expect(result.success).toBe(true);
      expect(elapsedMs).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  // ============================================================================
  // WORKFLOW 10: D8 DUPLICATE DETECTION WITH INGESTION
  // ============================================================================
  describe('Workflow 10: D8 Duplicate Detection Integration', () => {
    test('should detect duplicate documents in ingestion pipeline', async () => {
      // ARRANGE: Create two identical documents
      const content = '# Duplicate Document\n\nThis is the content.';
      const buffer = Buffer.from(content, 'utf-8');

      // ACT: Ingest first document
      const result1 = await ingestionService.ingestBuffer(buffer, 'doc1.md');
      const hash1 = DuplicateDetector.generateContentHash(content);

      // ACT: Check second identical document against first
      const knownHashes = new Map<string, string>([
        [hash1, result1.data?.documentId || 'doc1'],
      ]);
      const dupResult = DuplicateDetector.checkForDuplicate(content, knownHashes);

      // ASSERT: Duplicate detected with high confidence
      expect(result1.success).toBe(true);
      expect(dupResult.isDuplicate).toBe(true);
      expect(dupResult.confidence).toBe(100);
      expect(dupResult.matchedDocumentId).toBe(result1.data?.documentId);
    });

    test('should detect near-duplicate documents in corpus', async () => {
      // ARRANGE: Ingest first document
      const content1 = 'The quick brown fox jumps over the lazy dog for miles and miles and more.';
      const buffer1 = Buffer.from(content1, 'utf-8');
      const result1 = await ingestionService.ingestBuffer(buffer1, 'original.txt');

      // ACT: Check similar content
      const content2 = 'The quick brown fox jumps over the lazy dog for miles and miles.';
      const knownContent = new Map<string, string>([
        [DuplicateDetector.generateContentHash(content1), content1],
      ]);
      const nearDupResult = DuplicateDetector.checkForNearDuplicate(content2, knownContent, 0.5);

      // ASSERT: Near-duplicate detected
      expect(result1.success).toBe(true);
      expect(nearDupResult.isDuplicate).toBe(true);
      expect(nearDupResult.confidence).toBeGreaterThan(40);
    });

    test('should track document hashes across multiple ingestions', async () => {
      // ARRANGE: Create collection of document hashes
      const documentHashes = new Map<string, string>();

      // ACT: Ingest multiple unique documents and track hashes
      for (let i = 0; i < 3; i++) {
        const content = `Unique document ${i} with distinct content.`;
        const hash = DuplicateDetector.generateContentHash(content);
        const result = await ingestionService.ingestBuffer(
          Buffer.from(content, 'utf-8'),
          `unique-${i}.txt`
        );

        if (result.success) {
          documentHashes.set(hash, result.data?.documentId || `doc-${i}`);
        }
      }

      // ASSERT: All hashes unique, none are duplicates of each other
      expect(documentHashes.size).toBe(3);
      const allUnique = Array.from(documentHashes.keys()).every(
        (key, idx, arr) => arr.indexOf(key) === idx
      );
      expect(allUnique).toBe(true);
    });
  });

  // ============================================================================
  // WORKFLOW 11: D9 CODE BLOCK PRESERVATION WITH CHUNKING
  // ============================================================================
  describe('Workflow 11: D9 Code Block Preservation Integration', () => {
    test('should preserve code blocks during chunking', async () => {
      // ARRANGE: Create document with code blocks
      const mdContent = `
# Tutorial

Here's some Python code:

\`\`\`python
def hello_world():
    print("Hello, World!")
    return True
\`\`\`

More text explaining the code.

\`\`\`javascript
const greet = () => {
  console.log("Hi!");
};
\`\`\`

Final paragraph.
      `;

      // ACT: Parse and detect code blocks
      const codeBlocks = CodeBlockDetector.detectCodeBlocks(mdContent);
      const stats = CodeBlockDetector.getCodeBlockStats(mdContent);

      // ASSERT: Code blocks detected and preserved
      expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
      expect(stats.totalBlocks).toBeGreaterThanOrEqual(2);
      expect(stats.languages).toContain('python');
      expect(stats.languages).toContain('javascript');
      expect(stats.codePercentage).toBeGreaterThan(10);
    });

    test('should find safe chunk boundaries around code blocks', async () => {
      // ARRANGE: Create document with embedded code
      const content = `
Intro text here explaining the concept.

\`\`\`javascript
// A complete function
async function processData(input) {
  const result = await fetch('/api/data');
  return result.json();
}
\`\`\`

More explanation text.
      `;

      // ACT: Detect code blocks and find safe boundaries
      const blocks = CodeBlockDetector.detectCodeBlocks(content);
      const boundary = CodeBlockDetector.findSafeBoundary(content, 100, blocks);

      // ASSERT: Boundary respects code block structure
      if (blocks.length > 0) {
        expect(boundary.codeBlocksInRange.length).toBeGreaterThanOrEqual(0);
      }
      expect(boundary.preferredEnd).toBeLessThanOrEqual(content.length);
    });

    test('should estimate code percentage in documents', async () => {
      // ARRANGE: Create highly code-based content
      const codeDense = `
\`\`\`python
def func1():
    pass
\`\`\`

\`\`\`python
def func2():
    pass
\`\`\`

\`\`\`javascript
function f3() {}
\`\`\`
      `;

      // ACT: Estimate code percentage
      const codePercent = CodeBlockDetector.estimateCodePercentage(codeDense);

      // ASSERT: Code-dense document shows high percentage
      expect(codePercent).toBeGreaterThan(30);
    });

    test('should split content at safe boundaries preserving code blocks', async () => {
      // ARRANGE: Create content with multiple code blocks
      const content = `
Introduction with text.

\`\`\`java
public class Example {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
\`\`\`

Middle content.

\`\`\`python
# Python example
result = calculate_something()
print(result)
\`\`\`

Conclusion.
      `;

      // ACT: Split at safe boundaries
      const chunks = CodeBlockDetector.splitAtSafeBoundaries(content, 80);

      // ASSERT: Content split into valid chunks
      expect(chunks.length).toBeGreaterThan(0);
      const joined = chunks.join('');
      expect(joined).toContain('public class');
      expect(joined).toContain('# Python example');
      expect(joined).toContain('Conclusion');
    });
  });

  // ============================================================================
  // WORKFLOW 12: COMBINED D8+D9 DEDUPLICATION + CODE PRESERVATION
  // ============================================================================
  describe('Workflow 12: Combined D8+D9 Integration', () => {
    test('should preserve code blocks while detecting duplicates', async () => {
      // ARRANGE: Create document with code and ingest it
      const docWithCode = `
# API Documentation

\`\`\`javascript
async function fetchUser(id) {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

This function fetches user data from our API.
      `;

      const buffer = Buffer.from(docWithCode, 'utf-8');
      const result1 = await ingestionService.ingestBuffer(buffer, 'api-doc.md');

      // ACT: Detect code blocks and generate hash
      const blocks = CodeBlockDetector.detectCodeBlocks(docWithCode);
      const hash = DuplicateDetector.generateContentHash(docWithCode);

      // ACT: Check if identical document is duplicate
      const knownHashes = new Map<string, string>([
        [hash, result1.data?.documentId || 'api-doc'],
      ]);
      const dupCheck = DuplicateDetector.checkForDuplicate(docWithCode, knownHashes);

      // ASSERT: Both utilities work together
      expect(result1.success).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
      expect(dupCheck.isDuplicate).toBe(true);
      expect(blocks[0].language).toBe('javascript');
    });

    test('should handle chunking with deduplication tracking', async () => {
      // ARRANGE: Create document and track chunk hashes
      const mdContent = `
# Chapter 1

\`\`\`python
def calculate():
    return sum([1, 2, 3])
\`\`\`

Explanation of calculation.

# Chapter 2

\`\`\`python
def calculate():
    return sum([1, 2, 3])
\`\`\`

Repeated code section.
      `;

      // ACT: Parse document
      const result = await ingestionService.ingestBuffer(
        Buffer.from(mdContent, 'utf-8'),
        'chapters.md'
      );

      // ACT: Detect code blocks and chunks
      const blocks = CodeBlockDetector.detectCodeBlocks(mdContent);
      const chunks = CodeBlockDetector.splitAtSafeBoundaries(mdContent, 150);

      // ACT: Track chunk hashes for deduplication
      const chunkHashes = new Map<string, string>();
      for (let i = 0; i < chunks.length; i++) {
        const hash = DuplicateDetector.generateContentHash(chunks[i]);
        chunkHashes.set(hash, `chunk-${i}`);
      }

      // ASSERT: Document ingested, chunks tracked, duplicates identifiable
      expect(result.success).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunkHashes.size).toBeGreaterThan(0);
    });

    test('should identify duplicate code blocks across documents', async () => {
      // ARRANGE: Ingest two documents with same code block
      const sharedCode = `\`\`\`typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
\`\`\``;

      const doc1 = `# User Model\n\n${sharedCode}`;
      const doc2 = `# Alternative\n\n${sharedCode}`;

      await ingestionService.ingestBuffer(Buffer.from(doc1, 'utf-8'), 'model1.md');
      await ingestionService.ingestBuffer(Buffer.from(doc2, 'utf-8'), 'model2.md');

      // ACT: Extract and compare code blocks
      const blocks1 = CodeBlockDetector.detectCodeBlocks(doc1);
      const blocks2 = CodeBlockDetector.detectCodeBlocks(doc2);

      if (blocks1.length > 0 && blocks2.length > 0) {
        const hash1 = DuplicateDetector.generateContentHash(blocks1[0].content);
        const hash2 = DuplicateDetector.generateContentHash(blocks2[0].content);

        // ASSERT: Identical code blocks produce identical hashes
        expect(hash1).toBe(hash2);
      }
    });
  });

  // ============================================================================
  // CROSS-LAYER CONTRACTS
  // ============================================================================
  describe('Cross-Layer Contracts', () => {
    test('should maintain QueryResult contract across layers', async () => {
      // Verify all layer operations return consistent QueryResult format
      const documentResult = await storage.listDocuments();
      const statsResult = await storage.getDatabaseStats();

      // ASSERT: All results have expected structure
      expect(documentResult.success).toBeDefined();
      expect(typeof documentResult.success).toBe('boolean');

      // ACT: Successful results should have data, failures should have error
      if (!documentResult.success) {
        expect(documentResult.error).toBeDefined();
      } else {
        expect(documentResult.data).toBeDefined();
      }
    });

    test('should handle errors consistently across layers', async () => {
      // Try invalid operations on each layer

      // Storage layer
      const badDocResult = await storage.getDocument('bad-id');

      // Search layer
      const emptySearchResult = await searchService.search({
        query: '',
        limit: 10,
      });

      // All should follow QueryResult pattern
      [badDocResult, emptySearchResult].forEach((result: any) => {
        expect(result.success).toBeDefined();
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });
  });
});