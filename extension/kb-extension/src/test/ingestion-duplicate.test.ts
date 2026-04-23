import { DuplicateDetector } from '../ingestion/DuplicateDetector';

describe('Document Ingestion Duplicate Detection', () => {
  describe('D8: Duplicate Detection', () => {
    test('should generate consistent SHA-256 hashes', () => {
      const content = 'This is test content for hashing';
      const hash1 = DuplicateDetector.generateContentHash(content);
      const hash2 = DuplicateDetector.generateContentHash(content);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    test('should detect exact duplicate content', () => {
      const content = 'This is unique test content';
      const knownHashes = new Map<string, string>([
        [DuplicateDetector.generateContentHash(content), 'doc-123'],
      ]);

      const result = DuplicateDetector.checkForDuplicate(content, knownHashes);
      expect(result.isDuplicate).toBe(true);
      expect(result.matchedDocumentId).toBe('doc-123');
      expect(result.confidence).toBe(100);
    });

    test('should detect non-duplicate content', () => {
      const content = 'New unique content';
      const knownHashes = new Map<string, string>([
        [DuplicateDetector.generateContentHash('Different content'), 'doc-456'],
      ]);

      const result = DuplicateDetector.checkForDuplicate(content, knownHashes);
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.contentHash.length).toBe(64);
    });

    test('should detect near-duplicates using Jaccard similarity', () => {
      const content1 = 'The quick brown fox jumps over the lazy dog in the morning';
      const content2 = 'The quick brown fox jumps over the lazy dog';
      const knownContent = new Map<string, string>([
        [DuplicateDetector.generateContentHash(content1), content1],
      ]);

      const result = DuplicateDetector.checkForNearDuplicate(content2, knownContent, 0.6);
      expect(result.isDuplicate).toBe(true);
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.reason).toBe('near_duplicate_jaccard');
    });

    test('should reject low-similarity content as non-duplicate', () => {
      const content1 = 'The quick brown fox';
      const content2 = 'Completely different topic';
      const knownContent = new Map<string, string>([
        [DuplicateDetector.generateContentHash(content1), content1],
      ]);

      const result = DuplicateDetector.checkForNearDuplicate(content2, knownContent, 0.8);
      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBeLessThan(80);
    });

    test('should validate hash consistency', () => {
      const content = 'Validate this content';
      const correctHash = DuplicateDetector.generateContentHash(content);

      expect(DuplicateDetector.validateHashConsistency(content, correctHash)).toBe(true);
      expect(DuplicateDetector.validateHashConsistency(content, 'wronghash')).toBe(false);
    });

    test('should detect chunk-level duplicates', () => {
      const chunk1 = 'Code block content here';
      const chunkHash = DuplicateDetector.generateContentHash(chunk1);
      const knownChunks = new Map<string, string>([[chunkHash, 'doc-123']]);

      const result = DuplicateDetector.checkChunkForDuplicate(chunk1, knownChunks);
      expect(result.isDuplicate).toBe(true);
      expect(result.matchedDocumentId).toBe('doc-123');
      expect(result.reason).toBe('chunk_exact_hash_match');
    });

    test('should estimate deduplication potential', () => {
      const content = 'The quick brown fox jumps over the lazy dog';
      const knownContent = new Map<string, string>([
        ['hash1', 'The quick brown fox is fast'],
        ['hash2', 'A lazy dog sleeps all day'],
      ]);

      const potential = DuplicateDetector.estimateDeduplicationPotential(content, knownContent, 0.7);
      expect(potential).toBeGreaterThanOrEqual(0);
      expect(potential).toBeLessThanOrEqual(100);
    });

    test('should handle empty content gracefully', () => {
      const result = DuplicateDetector.checkForDuplicate('', new Map());
      expect(result.isDuplicate).toBe(false);
      expect(result.contentHash.length).toBe(64);
    });

    test('should detect multiple hash collisions', () => {
      const content1 = 'First document';
      const content2 = 'Second document';
      const content3 = 'Third document';

      const hash1 = DuplicateDetector.generateContentHash(content1);
      const hash2 = DuplicateDetector.generateContentHash(content2);
      const hash3 = DuplicateDetector.generateContentHash(content3);

      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);
    });
  });
});