/**
 * Duplicate Detection Utility (D8 - MEDIUM Priority)
 * 
 * Detects duplicate documents using content hashing and deduplication logic.
 * Supports SHA-256 based content comparison and chunk-level deduplication.
 */

import * as crypto from 'crypto';

/**
 * Duplicate detection result
 */
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  contentHash: string;
  matchedDocumentId?: string; // ID of matching document if duplicate found
  confidence: number; // 0-100 confidence that content is duplicate
  reason?: string; // Why marked as duplicate
}

/**
 * Duplicate Detector - Detects content duplicates using SHA-256 hashing
 */
export class DuplicateDetector {
  /**
   * Generate SHA-256 hash of content
   * 
   * @param content - Content to hash
   * @returns SHA-256 hash (hex string)
   */
  static generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if content is duplicate against known hashes
   * 
   * @param content - Content to check
   * @param knownHashes - Map of hash -> documentId
   * @returns Detection result with duplicate status
   */
  static checkForDuplicate(
    content: string,
    knownHashes: Map<string, string>
  ): DuplicateDetectionResult {
    const contentHash = this.generateContentHash(content);
    const matchedId = knownHashes.get(contentHash);

    if (matchedId) {
      return {
        isDuplicate: true,
        contentHash,
        matchedDocumentId: matchedId,
        confidence: 100,
        reason: 'exact_hash_match',
      };
    }

    return {
      isDuplicate: false,
      contentHash,
      confidence: 0,
    };
  }

  /**
   * Check for near-duplicates using fuzzy matching (Jaccard similarity)
   * 
   * @param content - Content to check
   * @param knownContent - Map of hash -> content (for known documents)
   * @param threshold - Similarity threshold (0-1, default 0.85)
   * @returns Detection result if similarity exceeds threshold
   */
  static checkForNearDuplicate(
    content: string,
    knownContent: Map<string, string>,
    threshold: number = 0.85
  ): DuplicateDetectionResult {
    const contentHash = this.generateContentHash(content);
    const contentShingles = this.getShingles(content, 5); // 5-gram shingles

    let highestSimilarity = 0;
    let matchedHash: string | undefined;

    // Compare with all known content
    for (const [hash, knownText] of knownContent.entries()) {
      const knownShingles = this.getShingles(knownText, 5);
      const similarity = this.jaccardSimilarity(contentShingles, knownShingles);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        matchedHash = hash;
      }
    }

    if (highestSimilarity >= threshold) {
      return {
        isDuplicate: true,
        contentHash,
        matchedDocumentId: matchedHash,
        confidence: Math.round(highestSimilarity * 100),
        reason: 'near_duplicate_jaccard',
      };
    }

    return {
      isDuplicate: false,
      contentHash,
      confidence: 0,
    };
  }

  /**
   * Get shingles (n-grams) from content for similarity comparison
   * 
   * @param content - Content to shingle
   * @param n - Shingle size (default 5)
   * @returns Set of shingles
   */
  private static getShingles(content: string, n: number = 5): Set<string> {
    const shingles = new Set<string>();
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();

    // Split into words and create n-grams
    const words = normalized.split(' ');
    for (let i = 0; i <= words.length - n; i++) {
      const shingle = words.slice(i, i + n).join(' ');
      shingles.add(shingle);
    }

    return shingles;
  }

  /**
   * Calculate Jaccard similarity between two sets
   * 
   * Jaccard = |intersection| / |union|
   */
  private static jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Check if chunk content is duplicate
   * 
   * @param chunkContent - Chunk to check
   * @param knownChunkHashes - Map of chunk hash -> source document
   * @param threshold - Hash match threshold (default: 1.0 for exact match)
   * @returns Detection result
   */
  static checkChunkForDuplicate(
    chunkContent: string,
    knownChunkHashes: Map<string, string>,
    threshold: number = 1.0
  ): DuplicateDetectionResult {
    const chunkHash = this.generateContentHash(chunkContent);

    if (threshold === 1.0) {
      // Exact match mode
      const matchedSource = knownChunkHashes.get(chunkHash);
      if (matchedSource) {
        return {
          isDuplicate: true,
          contentHash: chunkHash,
          matchedDocumentId: matchedSource,
          confidence: 100,
          reason: 'chunk_exact_hash_match',
        };
      }
    } else {
      // Fuzzy match mode (not implemented for chunks, fallback to exact)
      const matchedSource = knownChunkHashes.get(chunkHash);
      if (matchedSource) {
        return {
          isDuplicate: true,
          contentHash: chunkHash,
          matchedDocumentId: matchedSource,
          confidence: 100,
          reason: 'chunk_exact_hash_match',
        };
      }
    }

    return {
      isDuplicate: false,
      contentHash: chunkHash,
      confidence: 0,
    };
  }

  /**
   * Estimate deduplication potential for content
   * 
   * Returns % of potential duplicate content if more than threshold similar
   */
  static estimateDeduplicationPotential(
    content: string,
    knownContent: Map<string, string>,
    threshold: number = 0.8
  ): number {
    if (knownContent.size === 0) return 0;

    const contentShingles = this.getShingles(content, 5);
    let totalSimilarity = 0;

    for (const knownText of knownContent.values()) {
      const knownShingles = this.getShingles(knownText, 5);
      const similarity = this.jaccardSimilarity(contentShingles, knownShingles);
      if (similarity >= threshold) {
        totalSimilarity += similarity;
      }
    }

    return Math.min(100, Math.round((totalSimilarity / knownContent.size) * 100));
  }

  /**
   * Validate hash consistency
   * 
   * @param content - Content to validate
   * @param expectedHash - Expected hash
   * @returns true if hash matches content
   */
  static validateHashConsistency(content: string, expectedHash: string): boolean {
    const actualHash = this.generateContentHash(content);
    return actualHash === expectedHash;
  }
}
