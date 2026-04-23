/**
 * KB Chat Participant Handler
 * 
 * Handles user interactions with the KB participant in VS Code's Copilot Chat.
 * Provides slash commands and natural language queries for knowledge base operations.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { Document, IStorageManager, Tag } from '../types';
import { DocumentIngestionService } from '../ingestion/DocumentIngestionService';
import { createSearchService } from '../search/SearchService';
import type { SearchResult, SearchResponse } from '../search/types';
import type { QueryEmbeddingService } from '../embedding/QueryEmbeddingService';

type RagCitation = {
  index: number;
  documentName: string;
  sequence: number;
  chunkId: string;
  excerpt: string;
  score: number;
};

type ChatLanguageModel = {
  sendRequest: (
    messages: unknown[],
    options: Record<string, never>,
    token: vscode.CancellationToken
  ) => Promise<{ text: AsyncIterable<string> }>;
};

type KBChatParticipantOptions = {
  enableCopilotReranking?: boolean;
};

const MIN_COPILOT_RERANK_CANDIDATES = 3;
const MAX_COPILOT_RERANK_PROMPT_CHARS = 2400;
const CRITICAL_TAG_NAMES = new Set(['critical', 'important', 'keep', 'pinned', 'protected']);

export class KBChatParticipant {
  private storageManager: IStorageManager;
  private ingestionService: DocumentIngestionService;
  private queryEmbeddingService?: QueryEmbeddingService;
  private enableCopilotReranking: boolean;

  constructor(
    storageManager: IStorageManager,
    queryEmbeddingService?: QueryEmbeddingService,
    options: KBChatParticipantOptions = {}
  ) {
    this.storageManager = storageManager;
    this.ingestionService = new DocumentIngestionService(storageManager, queryEmbeddingService);
    this.queryEmbeddingService = queryEmbeddingService;
    this.enableCopilotReranking = options.enableCopilotReranking ?? false;
  }

  /**
   * Handle chat requests from Copilot Chat interface
   */
  async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      const command = this.getCommand(request);

      // Handle slash commands from either prompt text or ChatRequest.command
      if (command === 'search') {
        await this.handleSearch(request, stream, token);
      } else if (command === 'list') {
        await this.handleList(request, stream, token);
      } else if (command === 'ingest') {
        await this.handleIngest(request, stream, token);
      } else if (command === 'cleanup') {
        await this.handleCleanupNonCritical(stream, token);
      } else if (command === 'help') {
        await this.handleHelp(stream);
      } else {
        // Natural language query - default to search
        await this.handleSearch(request, stream, token);
      }
    } catch (error) {
      stream.markdown(`Error processing request: ${String(error)}`);
      console.error('[KB Chat] Error:', error);
    }
  }

  /**
   * Handle /search command - REAL SEARCH from ingested documents
   */
  private async handleSearch(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Searching knowledge base...');

    const query = this.getCommandArgument(request).toLowerCase();

    if (!query) {
      stream.markdown('Please provide a search query. Example: `/search how to implement authentication`');
      return;
    }

    try {
      const retrieval = await this.retrieveRelevantChunks(query, this.getRequestModel(request), token);

      if (!retrieval.success || !retrieval.data || retrieval.data.results.length === 0) {
        stream.markdown('### Search Results\n\n');
        stream.markdown(`**Query:** "${query}"\n\n`);
        stream.markdown('❌ **No results found**\n\n');
        stream.markdown('Your knowledge base is empty or no relevant chunks were found. Use `/ingest <file-path>` to add documents.');
        return;
      }

      const citations = this.buildCitations(retrieval.data.results);
      stream.progress('Generating grounded answer...');

      const answerGenerated = await this.streamGroundedAnswer(request, query, citations, stream, token);
      if (!answerGenerated) {
        this.streamFallbackGroundedAnswer(query, citations, stream);
      }

      if (retrieval.data.debug?.rerankingApplied) {
        stream.markdown('\n\n_Ranked with Copilot reranking._\n');
      }

      stream.markdown('\n\n### Sources\n');
      for (const citation of citations) {
        stream.markdown(
          `- [${citation.index}] **${citation.documentName}** chunk ${citation.sequence + 1} (score ${citation.score.toFixed(2)}): ${citation.excerpt}\n`
        );
      }
    } catch (error) {
      stream.markdown(`❌ Search error: ${String(error)}`);
      console.error('[KB Chat] Search error:', error);
    }
  }

  /**
   * Handle /list command
   */
  private async handleList(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Listing knowledge base documents...');

    try {
      const stats = await this.storageManager.getDatabaseStats();
      const listResult = await this.storageManager.listDocuments();

      if (!listResult.success || !listResult.data || listResult.data.length === 0) {
        stream.markdown('### 📚 Knowledge Base Documents\n\n');
        stream.markdown('**Status:** Empty\n\n');
        stream.markdown('Your knowledge base is currently empty. Add documents to get started:\n\n');
        stream.markdown('**To ingest documents:**\n');
        stream.markdown('```\n/ingest /path/to/document.md\n```\n\n');
        stream.markdown('**Supported formats:** Markdown (.md), Plain text (.txt), PDF (.pdf)');
        return;
      }

      const documents = listResult.data;
      stream.markdown('### 📚 Knowledge Base Documents\n\n');
      stream.markdown(`**Total Documents:** ${documents.length}\n`);
      stream.markdown(`**Total Chunks:** ${stats.chunkCount}\n`);
      stream.markdown(`**Total Vectors:** ${stats.vectorCount}\n\n`);

      stream.markdown('---\n\n');

      for (const doc of documents) {
        // Document header
        stream.markdown(`#### 📄 ${doc.name}\n\n`);
        
        // Document metadata
        stream.markdown('**Metadata:**\n');
        stream.markdown(`- **Type:** ${doc.type}\n`);
        stream.markdown(`- **Size:** ${(doc.size_bytes || 0).toLocaleString()} bytes\n`);
        stream.markdown(`- **Tokens:** ${doc.token_count || 0}\n`);
        
        if (doc.source_path) {
          stream.markdown(`- **Source:** \`${doc.source_path}\`\n`);
        }
        
        // Dates
        if (doc.created_date) {
          const created = typeof doc.created_date === 'string' 
            ? new Date(doc.created_date).toLocaleString() 
            : doc.created_date.toLocaleString();
          stream.markdown(`- **Ingested:** ${created}\n`);
        }
        
        stream.markdown('\n');
      }

      stream.markdown(`---\n\n**Database Stats:**\n`);
      stream.markdown(`- Documents: ${stats.documentCount}\n`);
      stream.markdown(`- Chunks: ${stats.chunkCount}\n`);
      stream.markdown(`- Vectors: ${stats.vectorCount}\n`);
      stream.markdown(`- Database Size: ${(stats.databaseSizeBytes / 1024 / 1024).toFixed(2)} MB\n`);
    } catch (error) {
      stream.markdown(`❌ Error listing documents: ${String(error)}`);
      console.error('[KB Chat] List error:', error);
    }
  }

  /**
   * Handle /ingest command - ACTUALLY INGEST THE FILE
   */
  private async handleIngest(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Preparing document ingestion...');

    const filePath = this.getCommandArgument(request);

    if (!filePath) {
      stream.markdown('Usage: `/ingest <file-path>`\n\n');
      stream.markdown('Supported formats:\n');
      stream.markdown('- Markdown (.md)\n');
      stream.markdown('- Plain text (.txt)\n');
      stream.markdown('- PDF (.pdf)\n\n');
      stream.markdown('Examples:\n');
      stream.markdown('- Absolute: `/ingest /temp/document.md`\n');
      stream.markdown('- Relative: `/ingest ../../document.md`\n');
      stream.markdown('- Home: `/ingest ~/Documents/document.md`');
      return;
    }

    // Resolve the file path
    let resolvedPath = this.resolvePath(filePath);

    // If not found, try relative to workspace root (../../)
    if (!resolvedPath && !path.isAbsolute(filePath)) {
      const workspaceRelative = path.join(__dirname, '../../..', filePath);
      if (fs.existsSync(workspaceRelative)) {
        resolvedPath = workspaceRelative;
      }
    }

    // Check if file was found
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      stream.markdown(`❌ **File not found:** \`${filePath}\`\n\n`);
      stream.markdown('Try one of these:\n');
      stream.markdown(`- Absolute path: \`/temp/${filePath}\`\n`);
      stream.markdown(`- Relative path: \`../../${filePath}\`\n`);
      stream.markdown('Use `/ingest /help` for more examples');
      return;
    }

    try {
      stream.markdown(`### Starting Ingestion\n\n`);
      stream.markdown(`**File:** \`${resolvedPath}\`\n`);
      stream.progress('Parsing document...');

      // Call ingestion service
      const result = await this.ingestionService.ingestFile(resolvedPath);

      if (!result.success || !result.data) {
        stream.markdown(`❌ **Ingestion failed:** ${result.error?.message || 'Unknown error'}`);
        console.error('[KB Chat] Ingest failed:', result.error);
        return;
      }

      const ingestionData = result.data;
      stream.markdown(`✅ **Ingestion completed successfully**\n\n`);
      stream.markdown(`**Results:**\n`);
      stream.markdown(`- **Document ID:** \`${ingestionData.documentId}\`\n`);
      stream.markdown(`- **Chunks created:** ${ingestionData.chunksCreated}\n`);
      stream.markdown(`- **Vectors created:** ${ingestionData.vectorsCreated}\n`);
      stream.markdown(`- **Processing time:** ${ingestionData.executionMs}ms\n`);

      stream.markdown(`\n**Status:** Document is now searchable in your knowledge base`);
    } catch (error) {
      stream.markdown(`❌ **Error during ingestion:** ${String(error)}`);
      console.error('[KB Chat] Ingest error:', error);
    }
  }

  /**
   * Handle /cleanup command - remove non-critical documents.
   */
  private async handleCleanupNonCritical(
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.progress('Removing non-critical documents...');

    const listResult = await this.storageManager.listDocuments();
    if (!listResult.success || !listResult.data || listResult.data.length === 0) {
      stream.markdown('### Cleanup Results\n\n');
      stream.markdown('No documents found. Nothing to remove.');
      return;
    }

    let removedCount = 0;
    let retainedCount = 0;
    const removedNames: string[] = [];
    const retainedNames: string[] = [];
    const skippedNames: string[] = [];

    for (const doc of listResult.data) {
      if (token.isCancellationRequested) {
        stream.markdown('Cleanup cancelled.');
        return;
      }

      const tagsResult = await this.storageManager.getDocumentTags(doc.id);
      if (!tagsResult.success || !tagsResult.data) {
        skippedNames.push(doc.name);
        continue;
      }

      if (this.isCriticalDocument(doc, tagsResult.data)) {
        retainedCount += 1;
        retainedNames.push(doc.name);
        continue;
      }

      const deleteResult = await this.storageManager.deleteDocument(doc.id);
      if (deleteResult.success && deleteResult.data?.deletedCount) {
        removedCount += 1;
        removedNames.push(doc.name);
      } else {
        skippedNames.push(doc.name);
      }
    }

    stream.markdown('### Cleanup Results\n\n');
    stream.markdown(`- Removed non-critical documents: **${removedCount}**\n`);
    stream.markdown(`- Retained critical documents: **${retainedCount}**\n`);
    stream.markdown(`- Skipped (tag lookup/delete failures): **${skippedNames.length}**\n\n`);

    if (removedNames.length > 0) {
      stream.markdown(`**Removed:** ${removedNames.join(', ')}\n\n`);
    }

    if (retainedNames.length > 0) {
      stream.markdown(`**Retained:** ${retainedNames.join(', ')}\n\n`);
    }

    if (skippedNames.length > 0) {
      stream.markdown(`**Skipped:** ${skippedNames.join(', ')}\n`);
    }
  }

  /**
   * Resolve file path with multiple strategies
   */
  private resolvePath(filePath: string): string | null {
    // Strategy 1: Absolute path
    if (path.isAbsolute(filePath)) {
      return fs.existsSync(filePath) ? filePath : null;
    }

    // Strategy 2: Home directory expansion
    if (filePath.startsWith('~')) {
      const expanded = path.join(process.env.HOME || '/root', filePath.slice(1));
      return fs.existsSync(expanded) ? expanded : null;
    }

    // Strategy 3: Relative to current working directory
    if (fs.existsSync(filePath)) {
      return filePath;
    }

    // Strategy 4: Relative to extension root
    const fromExtension = path.join(__dirname, filePath);
    if (fs.existsSync(fromExtension)) {
      return fromExtension;
    }

    return null;
  }

  private async retrieveRelevantChunks(
    query: string,
    model: ChatLanguageModel | undefined,
    token: vscode.CancellationToken
  ): Promise<{ success: true; data: SearchResponse } | { success: false; error: string }> {
    const dbConnection = this.getDatabaseConnection();

    if (!dbConnection) {
      return this.retrieveRelevantChunksFallback(query, model, token);
    }

    const searchService = createSearchService(dbConnection);
    let embedding: number[] | undefined;
    let embeddingModel: string | undefined;

    if (this.queryEmbeddingService) {
      try {
        embedding = await this.queryEmbeddingService.generateEmbedding(query);
        embeddingModel = this.queryEmbeddingService.modelName || 'default';
      } catch (error) {
        console.warn('[KB Chat] Query embedding generation failed, falling back to lexical retrieval:', error);
      }
    }

    if (token.isCancellationRequested) {
      return { success: false, error: 'Search cancelled' };
    }

    const searchResult = await searchService.search({
      query,
      embedding,
      embeddingModel,
      enableFts: true,
      enableVector: Boolean(embedding),
      hybridWeight: embedding ? 0.5 : 0,
      limit: embedding ? 5 : 8,
      enableReranking: true,
    });

    if (!searchResult.success || !searchResult.data) {
      return { success: false, error: searchResult.error?.message || 'Search failed' };
    }

    if (!embedding) {
      const reranked = await this.rerankResultsWithCopilot(query, searchResult.data.results, model, token);
      searchResult.data.results = reranked.results.slice(0, 5);
      searchResult.data.total = searchResult.data.results.length;
      searchResult.data.debug = {
        ...searchResult.data.debug,
        rerankingApplied: reranked.applied,
      };
    }

    return { success: true, data: searchResult.data };
  }

  private async retrieveRelevantChunksFallback(
    query: string,
    model: ChatLanguageModel | undefined,
    token: vscode.CancellationToken
  ): Promise<{ success: true; data: SearchResponse } | { success: false; error: string }> {
    const docsResult = await this.storageManager.listDocuments();
    if (!docsResult.success || !docsResult.data || docsResult.data.length === 0) {
      return { success: true, data: { results: [], total: 0, executionMs: 0, strategy: 'fts' } };
    }

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results: SearchResult[] = [];
    const start = Date.now();

    for (const doc of docsResult.data) {
      const chunkResult = await this.storageManager.listChunksByDocument(doc.id);
      if (!chunkResult.success || !chunkResult.data) {
        continue;
      }

      for (const chunk of chunkResult.data) {
        const haystack = `${doc.name} ${chunk.text}`.toLowerCase();
        const matchedTerms = terms.filter((term) => haystack.includes(term));
        if (matchedTerms.length === 0) {
          continue;
        }

        const score = matchedTerms.length / terms.length;
        results.push({
          chunkId: chunk.id,
          documentId: doc.id,
          text: chunk.text,
          documentName: doc.name,
          sequence: chunk.sequence,
          ftScore: score,
          score,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    const reranked = await this.rerankResultsWithCopilot(query, results.slice(0, 8), model, token);
    const finalResults = reranked.results.slice(0, 5);

    return {
      success: true,
      data: {
        results: finalResults,
        total: finalResults.length,
        executionMs: Date.now() - start,
        strategy: 'fts',
        debug: {
          rerankingApplied: reranked.applied,
        },
      },
    };
  }

  private async rerankResultsWithCopilot(
    query: string,
    results: SearchResult[],
    model: ChatLanguageModel | undefined,
    token: vscode.CancellationToken
  ): Promise<{ results: SearchResult[]; applied: boolean }> {
    if (
      !this.enableCopilotReranking ||
      !model ||
      results.length < MIN_COPILOT_RERANK_CANDIDATES ||
      token.isCancellationRequested
    ) {
      return { results, applied: false };
    }

    const candidates = this.selectRerankCandidatesWithinBudget(query, results);
    if (candidates.length < MIN_COPILOT_RERANK_CANDIDATES) {
      return { results, applied: false };
    }

    const prompt = [
      'You are ranking retrieved knowledge base chunks for relevance to a user query.',
      'Return ONLY a JSON array of chunk IDs ordered from most relevant to least relevant.',
      'Use only the chunk IDs provided below. If several are relevant, include all of them once.',
      `Query: ${query}`,
      'Candidates:',
      candidates
        .map(
          (result, index) =>
            `${index + 1}. chunkId=${result.chunkId}; document=${result.documentName}; sequence=${result.sequence + 1}; excerpt=${JSON.stringify(this.sanitizeExcerpt(result.text))}`
        )
        .join('\n'),
    ].join('\n\n');

    try {
      const response = await model.sendRequest(this.createLanguageModelMessages(prompt), {}, token);
      const rawText = await this.collectResponseText(response.text);
      const rankedIds = this.parseRerankedChunkIds(rawText);

      if (rankedIds.length === 0) {
        return { results, applied: false };
      }

      const byId = new Map(candidates.map((result) => [result.chunkId, result]));
      const reranked: SearchResult[] = [];
      for (const chunkId of rankedIds) {
        const result = byId.get(chunkId);
        if (result) {
          reranked.push(result);
          byId.delete(chunkId);
        }
      }

      return {
        results: [...reranked, ...results.filter((result) => byId.has(result.chunkId) || !candidates.some((candidate) => candidate.chunkId === result.chunkId))],
        applied: true,
      };
    } catch (error) {
      console.warn('[KB Chat] Copilot reranking failed, keeping lexical order:', error);
      return { results, applied: false };
    }
  }

  private selectRerankCandidatesWithinBudget(
    query: string,
    results: SearchResult[]
  ): SearchResult[] {
    const selected: SearchResult[] = [];
    const basePromptLength = [
      'You are ranking retrieved knowledge base chunks for relevance to a user query.',
      'Return ONLY a JSON array of chunk IDs ordered from most relevant to least relevant.',
      'Use only the chunk IDs provided below. If several are relevant, include all of them once.',
      `Query: ${query}`,
      'Candidates:',
    ].join('\n\n').length;

    let promptLength = basePromptLength;
    for (const result of results.slice(0, 8)) {
      const candidateLine = `${selected.length + 1}. chunkId=${result.chunkId}; document=${result.documentName}; sequence=${result.sequence + 1}; excerpt=${JSON.stringify(this.sanitizeExcerpt(result.text))}`;
      if (
        selected.length > 0 &&
        promptLength + candidateLine.length + 2 > MAX_COPILOT_RERANK_PROMPT_CHARS
      ) {
        break;
      }

      selected.push(result);
      promptLength += candidateLine.length + 2;
    }

    return selected;
  }

  private getDatabaseConnection(): any | null {
    const candidate = this.storageManager as IStorageManager & {
      getDatabaseConnection?: () => unknown;
    };

    return candidate.getDatabaseConnection ? candidate.getDatabaseConnection() : null;
  }

  private buildCitations(results: SearchResult[]): RagCitation[] {
    return results.slice(0, 5).map((result, index) => ({
      index: index + 1,
      documentName: result.documentName,
      sequence: result.sequence,
      chunkId: result.chunkId,
      excerpt: this.sanitizeExcerpt(result.text),
      score: result.score,
    }));
  }

  private sanitizeExcerpt(text: string): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, 220);
  }

  private isCriticalDocument(doc: Document, tags: Tag[]): boolean {
    const metadata = doc.metadata;
    const metadataCritical =
      typeof metadata === 'object' &&
      metadata !== null &&
      (metadata as Record<string, unknown>).critical === true;

    if (metadataCritical) {
      return true;
    }

    return tags.some((tag) => CRITICAL_TAG_NAMES.has(tag.name.trim().toLowerCase()));
  }

  private async streamGroundedAnswer(
    request: vscode.ChatRequest,
    query: string,
    citations: RagCitation[],
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<boolean> {
    const model = this.getRequestModel(request);

    if (!model?.sendRequest) {
      return false;
    }

    const contextBlock = citations
      .map(
        (citation) =>
          `[${citation.index}] Document: ${citation.documentName}; Chunk: ${citation.sequence + 1}; Chunk ID: ${citation.chunkId}\n${citation.excerpt}`
      )
      .join('\n\n');

    const prompt = [
      'You are a retrieval-grounded knowledge base assistant.',
      'Answer using only the provided context snippets.',
      'If the context is insufficient, say so explicitly.',
      'Cite supporting snippets inline using [1], [2], etc.',
      `Question: ${query}`,
      `Context:\n${contextBlock}`,
    ].join('\n\n');

    const response = await model.sendRequest(this.createLanguageModelMessages(prompt), {}, token);
    for await (const fragment of response.text) {
      stream.markdown(fragment);
    }

    return true;
  }

  private getRequestModel(request: vscode.ChatRequest): ChatLanguageModel | undefined {
    return (request as vscode.ChatRequest & { model?: ChatLanguageModel }).model;
  }

  private createLanguageModelMessages(prompt: string): unknown[] {
    const userMessageFactory = (vscode as typeof vscode & {
      LanguageModelChatMessage?: { User: (text: string) => unknown };
    }).LanguageModelChatMessage?.User;

    return [userMessageFactory ? userMessageFactory(prompt) : prompt];
  }

  private async collectResponseText(textStream: AsyncIterable<string>): Promise<string> {
    let combined = '';
    for await (const fragment of textStream) {
      combined += fragment;
    }
    return combined;
  }

  private parseRerankedChunkIds(rawText: string): string[] {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/u);
    if (!jsonMatch) {
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((value): value is string => typeof value === 'string');
    } catch {
      return [];
    }
  }

  private streamFallbackGroundedAnswer(
    query: string,
    citations: RagCitation[],
    stream: vscode.ChatResponseStream
  ): void {
    stream.markdown('### Answer\n\n');
    stream.markdown(`I found ${citations.length} relevant chunk(s) for **${query}**.\n\n`);
    stream.markdown('Most relevant evidence:\n');
    for (const citation of citations.slice(0, 3)) {
      stream.markdown(`- [${citation.index}] ${citation.excerpt}\n`);
    }
  }

  /**
   * Normalize the requested command from either ChatRequest.command or prompt text.
   */
  private getCommand(request: vscode.ChatRequest): string | null {
    const explicitCommand = request.command?.trim().toLowerCase();
    if (explicitCommand) {
      return explicitCommand;
    }

    const prompt = request.prompt.trim().toLowerCase();
    if (!prompt.startsWith('/')) {
      return null;
    }

    const [rawCommand] = prompt.split(/\s+/, 1);
    return rawCommand.slice(1) || null;
  }

  /**
   * Extract the non-command portion of the prompt for slash command handlers.
   */
  private getCommandArgument(request: vscode.ChatRequest): string {
    const explicitCommand = request.command?.trim();
    const prompt = request.prompt.trim();

    if (explicitCommand) {
      return prompt;
    }

    return prompt.replace(/^\/\S+\s*/u, '').trim();
  }

  /**
   * Handle /help command
   */
  private async handleHelp(stream: vscode.ChatResponseStream): Promise<void> {
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
    stream.markdown('### `/cleanup`\n');
    stream.markdown('Remove non-critical documents and keep documents tagged as `critical`, `important`, `keep`, `pinned`, or `protected`.\n\n');
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
