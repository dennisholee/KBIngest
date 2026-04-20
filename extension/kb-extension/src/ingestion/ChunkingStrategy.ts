/**
 * Document Chunking Strategies
 * 
 * Implements different strategies for splitting documents into chunks.
 */

import type { ParsedFile, DocumentChunk, ChunkingConfig, ChunkingResult, IChunkingStrategy, SupportedFileType } from './types';
import type { QueryResult } from '../types';

/**
 * Helper to create error response
 */
function createErrorResult<T>(message: string, code: string = 'CHUNK_ERROR'): QueryResult<T> {
  return {
    success: false,
    error: { code, message },
    data: undefined,
  };
}

/**
 * Token estimator for different languages
 * Uses rough estimates: ~1 token per 4 characters for English
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token per 4 characters (English average)
  return Math.ceil(text.length / 4);
}

/**
 * Base chunking strategy
 */
abstract class BaseChunkingStrategy implements IChunkingStrategy {
  protected strategyName: string;

  constructor(name: string) {
    this.strategyName = name;
  }

  abstract chunk(file: ParsedFile, config: ChunkingConfig): Promise<QueryResult<ChunkingResult>>;

  canChunk(fileType: SupportedFileType): boolean {
    // All strategies can handle all file types
    return true;
  }

  name(): string {
    return this.strategyName;
  }

  protected getChunkMetadata(
    content: string,
    sequence: number,
    file: ParsedFile,
    source?: string
  ): DocumentChunk['metadata'] {
    const metadata: DocumentChunk['metadata'] = {
      source: source || file.name,
      language: file.metadata?.language,
    };

    // Extract heading for markdown files
    if (file.type === 'markdown') {
      const headingMatch = content.match(/^#+\s+(.+)$/m);
      if (headingMatch) {
        metadata.heading = headingMatch[1];
      }
    }

    return metadata;
  }
}

/**
 * Fixed-Size Chunking Strategy
 * Splits document into chunks of fixed token count with overlap
 */
export class FixedSizeChunking extends BaseChunkingStrategy {
  constructor() {
    super('fixed-size');
  }

  async chunk(file: ParsedFile, config: ChunkingConfig): Promise<QueryResult<ChunkingResult>> {
    try {
      const chunkSize = config.chunkSize || 512;
      const chunkOverlap = config.chunkOverlap || 50;
      const minChunkSize = config.minChunkSize || 50;

      const chunks: DocumentChunk[] = [];
      const content = file.content;
      const tokens = this.tokenize(content);
      const totalTokens = tokens.length;

      let sequence = 0;
      let position = 0;

      while (position < tokens.length) {
        // Calculate chunk end
        let chunkEnd = Math.min(position + chunkSize, tokens.length);

        // Don't create tiny last chunk - merge with previous
        if (tokens.length - chunkEnd < minChunkSize && chunkEnd < tokens.length) {
          chunkEnd = tokens.length;
        }

        // Extract chunk tokens and convert back to text
        const chunkTokens = tokens.slice(position, chunkEnd);
        const chunkText = chunkTokens.join(' ');

        if (chunkText.trim().length > 0) {
          const chunk: DocumentChunk = {
            sequence: sequence++,
            text: chunkText,
            token_count: chunkTokens.length,
            metadata: this.getChunkMetadata(chunkText, sequence - 1, file),
          };
          chunks.push(chunk);
        }

        // Move to next chunk (with overlap)
        position += chunkSize - chunkOverlap;
      }

      const result: ChunkingResult = {
        chunks,
        totalChunks: chunks.length,
        estimatedTokens: totalTokens,
        metadata: {
          strategy: this.strategyName,
          language: file.metadata?.language,
          processedAt: new Date(),
        },
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Fixed-size chunking failed');
    }
  }

  private tokenize(text: string): string[] {
    // Simple tokenization: split on whitespace and punctuation boundaries
    return text
      .split(/\s+/)
      .filter(token => token.length > 0)
      .flatMap(token => {
        // Split on punctuation but keep punctuation
        return token
          .split(/(?=[.!?,;:\-—–])|(?<=[.!?,;:\-—–])/)
          .filter(t => t.length > 0);
      });
  }
}

/**
 * Semantic Chunking Strategy
 * Splits document at semantic boundaries (paragraphs, sections)
 */
export class SemanticChunking extends BaseChunkingStrategy {
  constructor() {
    super('semantic');
  }

  async chunk(file: ParsedFile, config: ChunkingConfig): Promise<QueryResult<ChunkingResult>> {
    try {
      const targetChunkSize = config.chunkSize || 512;
      const minChunkSize = config.minChunkSize || 50;
      const maxChunkSize = config.maxChunkSize || 2048;

      const chunks: DocumentChunk[] = [];
      const boundaries = this.findSemanticBoundaries(file);

      let sequence = 0;
      let currentChunk = '';
      let currentTokens = 0;

      for (let i = 0; i < boundaries.length; i++) {
        const section = boundaries[i];
        const sectionTokens = estimateTokens(section);

        // If adding this section exceeds target size, save current chunk
        if (currentTokens + sectionTokens > targetChunkSize && currentChunk.length > 0) {
          const chunk: DocumentChunk = {
            sequence: sequence++,
            text: currentChunk.trim(),
            token_count: currentTokens,
            metadata: this.getChunkMetadata(currentChunk, sequence - 1, file),
          };
          chunks.push(chunk);
          currentChunk = '';
          currentTokens = 0;
        }

        // Add section to current chunk
        currentChunk += (currentChunk.length > 0 ? '\n' : '') + section;
        currentTokens += sectionTokens;

        // Force save if chunk exceeds max size
        if (currentTokens >= maxChunkSize) {
          const chunk: DocumentChunk = {
            sequence: sequence++,
            text: currentChunk.trim(),
            token_count: currentTokens,
            metadata: this.getChunkMetadata(currentChunk, sequence - 1, file),
          };
          chunks.push(chunk);
          currentChunk = '';
          currentTokens = 0;
        }
      }

      // Save remaining chunk
      if (currentChunk.trim().length > 0) {
        const tokens = estimateTokens(currentChunk);
        if (tokens >= minChunkSize) {
          const chunk: DocumentChunk = {
            sequence: sequence++,
            text: currentChunk.trim(),
            token_count: tokens,
            metadata: this.getChunkMetadata(currentChunk, sequence - 1, file),
          };
          chunks.push(chunk);
        }
      }

      const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);

      const result: ChunkingResult = {
        chunks,
        totalChunks: chunks.length,
        estimatedTokens: totalTokens,
        metadata: {
          strategy: this.strategyName,
          language: file.metadata?.language,
          processedAt: new Date(),
        },
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Semantic chunking failed');
    }
  }

  private findSemanticBoundaries(file: ParsedFile): string[] {
    const content = file.content;
    const boundaries: string[] = [];

    if (file.type === 'markdown') {
      // Split on markdown headings and paragraphs
      const sections = content.split(/(?=^#{1,6}\s+|\n\n+)/m).filter(s => s.trim().length > 0);
      return sections;
    }

    // For plaintext and PDF: split on double newlines (paragraphs)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    return paragraphs;
  }
}

/**
 * Hybrid Chunking Strategy
 * Combines fixed-size chunking with semantic boundaries
 */
export class HybridChunking extends BaseChunkingStrategy {
  constructor() {
    super('hybrid');
  }

  async chunk(file: ParsedFile, config: ChunkingConfig): Promise<QueryResult<ChunkingResult>> {
    try {
      const chunkSize = config.chunkSize || 512;
      const minChunkSize = config.minChunkSize || 50;
      const maxChunkSize = config.maxChunkSize || 2048;

      const chunks: DocumentChunk[] = [];
      const boundaries = this.findBoundaries(file);

      let sequence = 0;
      let currentChunk = '';
      let currentTokens = 0;

      for (const boundary of boundaries) {
        const boundaryTokens = estimateTokens(boundary);

        // If adding boundary exceeds target size, force save
        if (currentTokens + boundaryTokens > chunkSize && currentChunk.length > 0) {
          const chunk: DocumentChunk = {
            sequence: sequence++,
            text: currentChunk.trim(),
            token_count: currentTokens,
            metadata: this.getChunkMetadata(currentChunk, sequence - 1, file),
          };
          chunks.push(chunk);
          currentChunk = '';
          currentTokens = 0;
        }

        // If single boundary exceeds max, split it further
        if (boundaryTokens > maxChunkSize) {
          // Fallback to fixed-size splitting
          const subChunks = this.splitLargeSegment(boundary, maxChunkSize);
          for (const subChunk of subChunks) {
            const chunk: DocumentChunk = {
              sequence: sequence++,
              text: subChunk.trim(),
              token_count: estimateTokens(subChunk),
              metadata: this.getChunkMetadata(subChunk, sequence - 1, file),
            };
            chunks.push(chunk);
          }
          currentChunk = '';
          currentTokens = 0;
        } else {
          currentChunk += (currentChunk.length > 0 ? '\n' : '') + boundary;
          currentTokens += boundaryTokens;
        }
      }

      // Save remaining chunk
      if (currentChunk.trim().length > 0 && estimateTokens(currentChunk) >= minChunkSize) {
        const chunk: DocumentChunk = {
          sequence: sequence++,
          text: currentChunk.trim(),
          token_count: estimateTokens(currentChunk),
          metadata: this.getChunkMetadata(currentChunk, sequence - 1, file),
        };
        chunks.push(chunk);
      }

      const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);

      const result: ChunkingResult = {
        chunks,
        totalChunks: chunks.length,
        estimatedTokens: totalTokens,
        metadata: {
          strategy: this.strategyName,
          language: file.metadata?.language,
          processedAt: new Date(),
        },
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Hybrid chunking failed');
    }
  }

  private findBoundaries(file: ParsedFile): string[] {
    const content = file.content;

    if (file.type === 'markdown') {
      // Split on headings and paragraph breaks
      return content
        .split(/(?=^#{1,6}\s+|\n\n+)/m)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim());
    }

    // For plaintext: split on paragraphs
    return content
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());
  }

  private splitLargeSegment(segment: string, maxTokens: number): string[] {
    // Fallback to fixed-size splitting with 20% overlap
    const tokens = segment.split(/\s+/);
    const stepSize = Math.floor(maxTokens * 0.8);
    const chunks: string[] = [];

    for (let i = 0; i < tokens.length; i += stepSize) {
      const chunkTokens = tokens.slice(i, i + maxTokens);
      chunks.push(chunkTokens.join(' '));
    }

    return chunks;
  }
}

/**
 * Chunking Strategy Factory
 */
export class ChunkingStrategyFactory {
  private strategies: Map<string, IChunkingStrategy>;

  constructor() {
    this.strategies = new Map();
    this.registerStrategy(new FixedSizeChunking());
    this.registerStrategy(new SemanticChunking());
    this.registerStrategy(new HybridChunking());
  }

  registerStrategy(strategy: IChunkingStrategy): void {
    this.strategies.set(strategy.name(), strategy);
  }

  getStrategy(name: string): IChunkingStrategy | null {
    return this.strategies.get(name) || null;
  }

  getSupportedStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}
