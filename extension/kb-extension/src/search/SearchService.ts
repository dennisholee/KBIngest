/**
 * Search Service Implementation
 * 
 * Handles full-text search (FTS5), vector search, and hybrid search operations
 * with relevance scoring and result reranking.
 */

import type { Database as SqlJsDatabase } from 'sql.js';
import type {
  ISearchService,
  SearchRequest,
  SearchResponse,
  SearchResult,
  RelevanceScoringConfig,
  SearchScoringHelpers,
} from './types';
import { SearchRankingStrategy } from './types';
import type { QueryResult } from '../types';
import { DatabaseError } from '../types';

/**
 * Default relevance scoring configuration
 */
const DEFAULT_SCORING_CONFIG: RelevanceScoringConfig = {
  ftWeight: 0.5,
  vectorWeight: 0.5,
  normalizeBm25: true,
  normalizeVectors: true,
  exactMatchBoost: 1.5,
  tagMatchBoost: 1.2,
  minScore: 0.0,
};

/**
 * SearchService: Core search engine for KB
 */
export class SearchService implements ISearchService {
  private db: SqlJsDatabase;
  private scoringConfig: RelevanceScoringConfig;
  private helpers: SearchScoringHelpers;

  constructor(db: SqlJsDatabase, scoring?: Partial<RelevanceScoringConfig>) {
    this.db = db;
    this.scoringConfig = { ...DEFAULT_SCORING_CONFIG, ...scoring };
    this.helpers = this.createScoringHelpers();
  }

  /**
   * Create scoring helper functions
   */
  private createScoringHelpers(): SearchScoringHelpers {
    return {
      normalizeBm25: (score: number, maxScore = 100) => {
        return Math.min(1.0, score / maxScore);
      },

      normalizeCosine: (similarity: number) => {
        // Cosine similarity is already -1 to 1, map to 0-1
        return (similarity + 1.0) / 2.0;
      },

      combineScores: (scores, weights) => {
        const ftsScore = scores.fts ?? 0;
        const vectorScore = scores.vector ?? 0;
        const ftsWeight = weights.fts ?? 0.5;
        const vectorWeight = weights.vector ?? 0.5;

        const totalWeight = ftsWeight + vectorWeight;
        if (totalWeight === 0) {
          return 0;
        }

        return (ftsScore * ftsWeight + vectorScore * vectorWeight) / totalWeight;
      },

      calculateMetadataBoost: (result, tags = [], collections = []) => {
        let boost = 1.0;

        if (tags.length > 0 && result.tags?.some((t) => tags.includes(t))) {
          boost *= this.scoringConfig.tagMatchBoost;
        }

        if (
          collections.length > 0 &&
          result.collections?.some((c) => collections.includes(c))
        ) {
          boost *= this.scoringConfig.tagMatchBoost;
        }

        return boost;
      },
    };
  }

  /**
   * Full-text search using SQLite FTS5
   */
  async searchFullText(query: string, limit = 10): Promise<QueryResult<SearchResult[]>> {
    try {
      // Escape special FTS5 characters
      const escapedQuery = this._escapeFtsQuery(query);

      const rows = this._queryAll(`
        SELECT 
          c.id as chunkId,
          c.document_id as documentId,
          c.text,
          d.name as documentName,
          c.sequence,
          RANK as ftsScore
        FROM chunks_fts
        JOIN chunks c ON chunks_fts.chunk_id = c.id
        JOIN documents d ON c.document_id = d.id
        WHERE chunks_fts MATCH ?
        ORDER BY RANK ASC
        LIMIT ?
      `, [escapedQuery, limit]) as Array<{
        chunkId: string;
        documentId: string;
        text: string;
        documentName: string;
        sequence: number;
        ftsScore: number;
      }>;

      // Convert FTS scores to 0-1 range
      const results: SearchResult[] = rows.map((row) => ({
        chunkId: row.chunkId,
        documentId: row.documentId,
        text: row.text,
        documentName: row.documentName,
        sequence: row.sequence,
        ftScore: this.helpers.normalizeBm25(Math.abs(row.ftsScore)),
        score: this.helpers.normalizeBm25(Math.abs(row.ftsScore)),
      }));

      return { success: true, data: results };
    } catch (error) {
      return this._searchChunkTextFallback(query, limit, String(error));
    }
  }

  /**
   * Vector search using cosine similarity
   */
  async searchVector(
    embedding: number[],
    model: string,
    limit = 10
  ): Promise<QueryResult<SearchResult[]>> {
    try {
      // Get all vectors with same model
      const rows = this._queryAll(`
        SELECT 
          c.id as chunkId,
          c.document_id as documentId,
          c.text,
          d.name as documentName,
          c.sequence,
          v.embedding,
          v.dimension
        FROM vectors v
        JOIN chunks c ON v.chunk_id = c.id
        JOIN documents d ON c.document_id = d.id
        WHERE v.model_name = ?
        LIMIT ?
      `, [model, limit * 3]) as Array<{
        chunkId: string;
        documentId: string;
        text: string;
        documentName: string;
        sequence: number;
        embedding: string; // JSON
        dimension: number;
      }>;

      // Calculate cosine similarity and sort
      const results: SearchResult[] = rows
        .map((row) => {
          const storedVector = JSON.parse(row.embedding);
          const similarity = this._cosineSimilarity(embedding, storedVector);

          return {
            chunkId: row.chunkId,
            documentId: row.documentId,
            text: row.text,
            documentName: row.documentName,
            sequence: row.sequence,
            vectorScore: this.helpers.normalizeCosine(similarity),
            score: this.helpers.normalizeCosine(similarity),
          };
        })
        .sort((a, b) => (b.vectorScore ?? 0) - (a.vectorScore ?? 0))
        .slice(0, limit);

      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: { code: 'VECTOR_SEARCH_ERROR', message: String(error) },
      };
    }
  }

  /**
   * Hybrid search combining FTS and vector
   */
  async searchHybrid(request: SearchRequest): Promise<QueryResult<SearchResponse>> {
    try {
      const startTime = Date.now();
      const results: Map<string, SearchResult> = new Map();

      const enableFts = request.enableFts !== false && request.query;
      const enableVector = request.enableVector !== false && request.embedding;

      // FTS search if query provided
      if (enableFts) {
        const ftsResult = await this.searchFullText(request.query!, request.limit ?? 10);
        if (ftsResult.success && ftsResult.data) {
          for (const result of ftsResult.data) {
            results.set(result.chunkId, result);
          }
        }
      }

      // Vector search if embedding provided
      if (enableVector && request.embedding) {
        const vectorResult = await this.searchVector(
          request.embedding,
          request.embeddingModel || 'default',
          request.limit ?? 10
        );

        if (vectorResult.success && vectorResult.data) {
          for (const result of vectorResult.data) {
            const existing = results.get(result.chunkId);
            if (existing) {
              // Merge scores using hybrid weight
              existing.vectorScore = result.vectorScore;
              existing.score = this.helpers.combineScores(
                { fts: existing.ftScore, vector: existing.vectorScore },
                { fts: 1 - (request.hybridWeight ?? 0.5), vector: request.hybridWeight ?? 0.5 }
              );
            } else {
              results.set(result.chunkId, result);
            }
          }
        }
      }

      // Apply filters
      let filtered = Array.from(results.values());
      filtered = this._applyFilters(filtered, request);

      // Apply reranking if requested
      if (request.enableReranking) {
        filtered = await this.rerank(
          filtered,
          request.query || request.embedding?.join(',') || ''
        );
      }

      // Sort by score
      filtered.sort((a, b) => b.score - a.score);

      // Apply limit and offset
      const limit = request.limit ?? 10;
      const offset = request.offset ?? 0;
      const paged = filtered.slice(offset, offset + limit);

      const executionMs = Date.now() - startTime;

      return {
        success: true,
        data: {
          results: paged,
          total: filtered.length,
          executionMs,
          strategy: 'hybrid',
          debug: {
            ftResultsCount: enableFts ? (await this.searchFullText(request.query!)).data?.length : 0,
            vectorResultsCount: enableVector ? (await this.searchVector(request.embedding!, request.embeddingModel || 'default')).data?.length : 0,
            rerankingApplied: request.enableReranking,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'HYBRID_SEARCH_ERROR', message: String(error) },
      };
    }
  }

  /**
   * Multi-criteria search with all options
   */
  async search(request: SearchRequest): Promise<QueryResult<SearchResponse>> {
    return this.searchHybrid(request);
  }

  /**
   * Rerank results based on query relevance
   */
  async rerank(
    results: SearchResult[],
    query: string,
    scoring?: RelevanceScoringConfig
  ): Promise<SearchResult[]> {
    const config = { ...this.scoringConfig, ...scoring };

    // Simple reranking: boost exact matches
    return results.map((result) => {
      let boost = 1.0;

      // Boost exact phrase matches
      if (result.text.toLowerCase().includes(query.toLowerCase())) {
        boost *= config.exactMatchBoost;
      }

      return {
        ...result,
        score: Math.min(1.0, result.score * boost),
      };
    });
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    indexedChunks: number;
    ftsIndexSize: number;
    lastIndexUpdate: Date;
  }> {
    try {
      const docs = this._queryOne('SELECT COUNT(*) as count FROM documents') as { count: number };
      const chunks = this._queryOne('SELECT COUNT(*) as count FROM chunks') as { count: number };
      const indexed = this._queryOne('SELECT COUNT(*) as count FROM vectors') as { count: number };

      return {
        totalDocuments: docs.count,
        totalChunks: chunks.count,
        indexedChunks: indexed.count,
        ftsIndexSize: 0, // FTS index size not easily queryable
        lastIndexUpdate: new Date(),
      };
    } catch {
      return {
        totalDocuments: 0,
        totalChunks: 0,
        indexedChunks: 0,
        ftsIndexSize: 0,
        lastIndexUpdate: new Date(),
      };
    }
  }

  /**
   * Apply filters to search results
   */
  private _applyFilters(results: SearchResult[], request: SearchRequest): SearchResult[] {
    return results.filter((result) => {
      // Filter by tags (would need to fetch tags from DB)
      if (request.tags && request.tags.length > 0) {
        // TODO: Implement tag filtering when tags are fetched
      }

      // Filter by collections (would need to fetch collections from DB)
      if (request.collections && request.collections.length > 0) {
        // TODO: Implement collection filtering when collections are fetched
      }

      // Filter by document type
      if (request.documentTypes && request.documentTypes.length > 0) {
        // TODO: Implement document type filtering
      }

      // Filter by date range
      if (request.dateRange) {
        // TODO: Implement date range filtering
      }

      // Apply minimum score threshold
      if (result.score < this.scoringConfig.minScore) {
        return false;
      }

      return true;
    });
  }

  /**
   * Escape special characters for FTS5 queries
   */
  private _escapeFtsQuery(query: string): string {
    // Escape FTS5 special characters
    return query.replace(/[":*]/g, '\\$&');
  }

  private _queryAll(sql: string, params: any[] = []): any[] {
    const boundSql = this._bindParams(sql, params);
    const result = this.db.exec(boundSql);
    if (result.length === 0) {
      return [];
    }

    return result[0].values.map((row) => this._rowToObject(result[0].columns, row));
  }

  private _queryOne(sql: string, params: any[] = []): any {
    return this._queryAll(sql, params)[0] ?? null;
  }

  private _bindParams(sql: string, params: any[]): string {
    let boundSql = sql;
    for (const param of params) {
      const value = param === null
        ? 'NULL'
        : typeof param === 'string'
          ? `'${param.replace(/'/g, "''")}'`
          : String(param);
      boundSql = boundSql.replace('?', value);
    }
    return boundSql;
  }

  private _rowToObject(columns: string[], values: any[]): Record<string, any> {
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  }

  /**
   * Fallback retrieval when FTS5 is unavailable in sql.js.
   */
  private _searchChunkTextFallback(
    query: string,
    limit: number,
    originalError?: string
  ): QueryResult<SearchResult[]> {
    try {
      const loweredQuery = query.trim().toLowerCase();
      const terms = loweredQuery.split(/\s+/).filter(Boolean);

      if (terms.length === 0) {
        return { success: true, data: [] };
      }

      const rows = this._queryAll(`
        SELECT
          c.id as chunkId,
          c.document_id as documentId,
          c.text,
          d.name as documentName,
          c.sequence
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
      `) as Array<{
        chunkId: string;
        documentId: string;
        text: string;
        documentName: string;
        sequence: number;
      }>;

      const scoredResults: Array<SearchResult | null> = rows
        .map((row) => {
          const haystack = `${row.documentName} ${row.text}`.toLowerCase();
          const matchedTerms = terms.filter((term) => haystack.includes(term));
          const exactPhrase = haystack.includes(loweredQuery);

          if (matchedTerms.length === 0) {
            return null;
          }

          const baseScore = matchedTerms.length / terms.length;
          const boostedScore = exactPhrase
            ? Math.min(1.0, baseScore * this.scoringConfig.exactMatchBoost)
            : baseScore;

          return {
            chunkId: row.chunkId,
            documentId: row.documentId,
            text: row.text,
            documentName: row.documentName,
            sequence: row.sequence,
            ftScore: boostedScore,
            score: boostedScore,
          };
        });

      const results = scoredResults
        .filter((result): result is SearchResult => Boolean(result))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        success: true,
        data: results,
        metadata: originalError
          ? { executionTime: 0, rowsAffected: results.length }
          : undefined,
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: {
          code: 'FTS_SEARCH_ERROR',
          message: originalError
            ? `${originalError}; fallback failed: ${String(fallbackError)}`
            : String(fallbackError),
        },
      };
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private _cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

/**
 * Create SearchService with database connection
 */
export function createSearchService(
  db: SqlJsDatabase,
  scoring?: Partial<RelevanceScoringConfig>
): SearchService {
  return new SearchService(db, scoring);
}
