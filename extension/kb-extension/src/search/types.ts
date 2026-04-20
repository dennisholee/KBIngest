/**
 * Search Service Types and Interfaces
 * 
 * Defines search operation contracts including:
 * - Search request/response models
 * - Search result ranking strategies
 * - Relevance scoring systems
 */

import type { QueryResult } from '../types';

/**
 * Individual search result (ranked chunk with source metadata)
 */
export interface SearchResult {
  /** Chunk ID */
  chunkId: string;

  /** Parent document ID */
  documentId: string;

  /** Chunk text content */
  text: string;

  /** Document name for context */
  documentName: string;

  /** Chunk sequence position in document */
  sequence: number;

  /** Overall relevance score (0-1) */
  score: number;

  /** Full-text search score component (0-1) */
  ftScore?: number;

  /** Vector similarity score component (0-1) */
  vectorScore?: number;

  /** Tag names applied to document */
  tags?: string[];

  /** Collection names containing document */
  collections?: string[];
}

/**
 * Structured search request
 */
export interface SearchRequest {
  /** Search query string (for full-text search) */
  query?: string;

  /** Embedding vector for semantic search */
  embedding?: number[];

  /** Model used to generate embedding */
  embeddingModel?: string;

  /** Tag names to filter by */
  tags?: string[];

  /** Collection names to filter by */
  collections?: string[];

  /** Document types to include */
  documentTypes?: Array<'markdown' | 'plaintext' | 'pdf'>;

  /** Date range filter */
  dateRange?: {
    from: Date;
    to: Date;
  };

  /** Maximum results to return */
  limit?: number;

  /** Result offset for pagination */
  offset?: number;

  /** Blend weight for hybrid search (0=FT only, 1=vector only, 0.5=equal) */
  hybridWeight?: number;

  /** Enable full-text search component */
  enableFts?: boolean;

  /** Enable vector search component */
  enableVector?: boolean;

  /** Enable result reranking */
  enableReranking?: boolean;
}

/**
 * Search response with results and metadata
 */
export interface SearchResponse {
  /** Search results in relevance order */
  results: SearchResult[];

  /** Total matching documents (for pagination) */
  total: number;

  /** Query execution time in milliseconds */
  executionMs: number;

  /** Search strategy used */
  strategy: 'fts' | 'vector' | 'hybrid';

  /** Debug information */
  debug?: {
    ftResultsCount?: number;
    vectorResultsCount?: number;
    rerankingApplied?: boolean;
  };
}

/**
 * Search ranking strategy
 */
export enum SearchRankingStrategy {
  /** Full-text search (BM25-like via FTS5) */
  FTS = 'fts',

  /** Vector similarity (cosine distance) */
  VECTOR = 'vector',

  /** Hybrid (combined FTS + vector) */
  HYBRID = 'hybrid',

  /** Reranked (cross-encoder re-scoring) */
  RERANKED = 'reranked',
}

/**
 * Relevance scoring configuration
 */
export interface RelevanceScoringConfig {
  /** Weight for FTS component (0-1) */
  ftWeight: number;

  /** Weight for vector similarity (0-1) */
  vectorWeight: number;

  /** Enable BM25 score normalization */
  normalizeBm25: boolean;

  /** Enable cosine distance normalization */
  normalizeVectors: boolean;

  /** Boost factor for exact phrase matches */
  exactMatchBoost: number;

  /** Boost factor for tag matches */
  tagMatchBoost: number;

  /** Minimum score threshold (0-1) */
  minScore: number;
}

/**
 * Search service interface
 */
export interface ISearchService {
  // Full-text search
  searchFullText(query: string, limit?: number): Promise<QueryResult<SearchResult[]>>;

  // Vector/semantic search
  searchVector(
    embedding: number[],
    model: string,
    limit?: number
  ): Promise<QueryResult<SearchResult[]>>;

  // Hybrid search (FTS + vector)
  searchHybrid(request: SearchRequest): Promise<QueryResult<SearchResponse>>;

  // Multi-criteria search with filters
  search(request: SearchRequest): Promise<QueryResult<SearchResponse>>;

  // Rerank results with custom scoring
  rerank(
    results: SearchResult[],
    query: string,
    scoring?: RelevanceScoringConfig
  ): Promise<SearchResult[]>;

  // Get search statistics
  getSearchStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    indexedChunks: number;
    ftsIndexSize: number;
    lastIndexUpdate: Date;
  }>;
}

/**
 * Search scoring helpers
 */
export interface SearchScoringHelpers {
  /** Normalize BM25 score to 0-1 range */
  normalizeBm25(score: number, maxScore?: number): number;

  /** Normalize cosine similarity to 0-1 range */
  normalizeCosine(similarity: number): number;

  /** Combine multiple scores with weights */
  combineScores(scores: { fts?: number; vector?: number }, weights: { fts?: number; vector?: number }): number;

  /** Calculate relevance boost for metadata matches */
  calculateMetadataBoost(result: SearchResult, tags?: string[], collections?: string[]): number;
}
