# VS Code KB Extension - Comprehensive Architecture Design

**Project**: Personal Knowledge Base Integration with Copilot  
**Target Users**: Individual developers  
**Scale**: <50 users, <1K documents  
**Timeline**: MVP in 2-3 months  
**Tech Stack**: TypeScript/Node.js, React, SQLite, Qdrant, MCP  

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Data Models](#data-models)
4. [Integration Points](#integration-points)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Cost Analysis](#cost-analysis)
7. [Security & Best Practices](#security--best-practices)
8. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### Style: Modular Monolith + Embedded Components (100% Local)

This architecture combines a single deployable unit (the VS Code extension) with all components embedded locally:

- **Monolith**: Single Node.js process running in VS Code's extension host
- **Embedded Components**: All components run locally within extension or on user's machine
  - Qdrant (local Docker or in-process)
  - SQLite (local file storage)
  - Embedding models (local JS models + optional Ollama)
- **Communication**: All synchronous, local APIs (zero external dependencies)

**Why this works for you:**
- ✅ **100% Local & Offline**: Zero external API calls; works completely offline
- ✅ **Zero Infrastructure**: No servers, cloud accounts, or API subscriptions needed
- ✅ **Privacy First**: All data stays on your machine only
- ✅ **Simple Deployment**: Single .vsix package, works immediately after install
- ✅ **Zero Cost**: Completely free to use (no embedding API fees)
- ✅ **Fast & Responsive**: All local APIs, minimal latency (<100ms searches)
- ✅ **Scales**: From personal to team use without architecture changes

---

## System Components

### 1. Frontend: KB Sidebar UI

**Technology**: React 18 + TypeScript + Webview API  
**Responsibilities**:
- Document browser with tree view (collections, folders)
- Search interface with full-text + semantic search
- Document preview (Markdown, PDF, plain text)
- Ingestion UI (drag-drop, folder import)
- Tag/metadata editor

**Key Features**:
```
┌─────────────────────────────────┐
│ KB Explorer                     │
├─────────────────────────────────┤
│ 📁 Collections (Expandable)     │
│   📄 Document 1                 │
│   📄 Document 2                 │
├─────────────────────────────────┤
│ 🔍 Search Bar                   │
│    ├─ Full-text search         │
│    └─ Semantic similarity      │
├─────────────────────────────────┤
│ 📋 Document Preview Pane        │
│    ├─ Markdown render          │
│    ├─ PDF viewer               │
│    └─ Metadata panel           │
└─────────────────────────────────┘
```

**Communication Protocol**:
- Uses VS Code Webview API for IPC (postMessage)
- Redux-like state management for UI consistency
- Real-time updates on ingestion/search

---

### 2. Backend: Extension Host Process

**Technology**: Node.js 18+, Express (lightweight), TypeScript  
**Responsibilities**:
- Message routing between UI, MCP server, and services
- Lifecycle management
- Error handling & logging

**Architecture**:
```typescript
// Extension activation
export async function activate(context: vscode.ExtensionContext) {
  const storage = new StorageManager(context.globalStorageUri);
  const sqlite = new SqliteManager(storage);
  const qdrantClient = new QdrantClient(config);
  const ingestService = new IngestionService(sqlite, qdrantClient);
  const searchService = new SearchService(qdrantClient, sqlite);
  const mcpServer = new MCPServer(searchService);
  
  // Register UI handlers
  registerUIHandlers(context, ingestService, searchService);
  
  // Start MCP server
  await mcpServer.start();
}
```

---

### 3. Ingestion Service

**Responsibilities**:
- Document parsing (PDF, Markdown, plain text, Word)
- Chunking strategy
- Embedding generation
- Vector storage to Qdrant
- Metadata storage to SQLite

**Workflow** (100% Local):
```
1. User uploads document(s)
   ↓
2. ParseDocument(format) → text content
   [Local parsing in VS Code process]
   ↓
3. ChunkText(strategy: "paragraph" | "semantic") → chunks[]
   [Local text processing]
   ↓
4. GenerateEmbeddings(chunks) → 384D vectors
   [Local @xenova/transformers model runs in-process]
   [NO API CALLS - completely offline]
   ↓
5. StoreInQdrant(chunks + vectors)
   [Local Docker Qdrant or embedded SQLite FTS]
   StoreInSQLite(document_index, chunk_refs)
   [Local SQLite file in VS Code storage]
   ↓
6. UpdateUI (refresh sidebar, count)
   [Instant local updates - no network latency]
```
All steps happen within the extension process or on the local machine.
Zero external API calls. Works completely offline.

**Chunking Strategies**:
- **Paragraph-based**: Split on blank lines (simple, fast)
- **Semantic**: Token-aware chunking with overlap (better for RAG)
- **Custom**: User-defined chunk size & overlap

**Embedding Options** (All Local - No API Required):

1. **Embedded JS Model** (Primary MVP - Zero Setup):
   - Library: `@xenova/transformers` (ONNX runtime in JavaScript)
   - Model: `Xenova/all-MiniLM-L6-v2` 
   - Size: ~60MB download (cached in extension)
   - Speed: ~100-200ms per chunk
   - Dimension: 384D (covers 99% of search quality vs 1536D)
   - **Cost**: FREE
   - **Setup**: Automatic, zero user action needed

2. **Ollama Integration** (Phase B, Optional Performance Upgrade):
   - Local LLM server on user's machine
   - Model: `nomic-embed-text` (1536D, faster than JS)
   - Requirements: Docker + 2GB RAM
   - Speed: ~50-100ms per chunk (faster than JS)
   - **Cost**: FREE
   - **Setup**: User optionally installs Ollama if they want better performance

3. **LM Studio Integration** (Phase B, Optional):
   - User runs their own embedding model
   - No Docker required, GUI-based
   - Flexible model selection
   - **Cost**: FREE
   - **Setup**: Optional user choice

**MVP Decision**: Use embedded JS model (`@xenova/transformers`). Users can optionally upgrade to Ollama for 2-4x faster embedding if they want

---

### 4. Search Service

**Responsibilities**:
- Vector similarity search in Qdrant
- Metadata-based filtering
- Hybrid search (full-text + semantic)
- Result ranking & deduplication

**Query Types**:
```typescript
interface SearchQuery {
  type: "semantic" | "fulltext" | "hybrid";
  query: string;
  filters?: {
    collection?: string;
    tags?: string[];
    dateRange?: [Date, Date];
  };
  limit?: number;
  threshold?: number; // similarity score (0-1)
}

// Semantic search: embed query, find similar vectors
// Full-text: SQLite FTS (full-text search)
// Hybrid: combine both with weighted scoring
```

**Result Structure**:
```typescript
interface SearchResult {
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number; // 0-1
  metadata: {
    source: string;
    collection: string;
    tags: string[];
    createdAt: Date;
  };
}
```

---

### 5. MCP Server Integration

**Purpose**: Enable Copilot Chat to access KB as a tool/resource

**Anthropic MCP Protocol**:
```typescript
// MCP Tools (Copilot can invoke these)
tools: [
  {
    name: "search_kb",
    description: "Search knowledge base for relevant documents",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "get_document",
    description: "Retrieve full document by ID",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" }
      }
    }
  }
]

// MCP Resources (Copilot can reference these)
resources: [
  {
    uri: "kb://documents/recent",
    name: "Recent Documents",
    description: "Last 10 ingested documents"
  },
  {
    uri: "kb://collections/all",
    name: "All Collections",
    description: "List of all KB collections"
  }
]
```

**Workflow**:
1. User asks Copilot a question
2. Copilot Chat calls `search_kb` tool via MCP
3. MCP server queries Search Service
4. Results returned to Copilot context
5. Copilot generates answer with KB context

---

### 6. Data Storage Layer

#### SQLite (Metadata)

**Database Schema**:
```sql
-- Documents index
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_path TEXT,
  content_hash TEXT,
  document_type TEXT, -- pdf, markdown, plaintext, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  collection_id TEXT,
  metadata JSON
);

-- Chunks index (for full-text search)
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  chunk_index INTEGER,
  content TEXT,
  char_offset INTEGER,
  chunk_size INTEGER,
  created_at TIMESTAMP,
  UNIQUE(document_id, chunk_index)
);

-- Vector references (linking Qdrant points to SQLite)
CREATE TABLE vectors (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL REFERENCES chunks(id),
  qdrant_point_id INTEGER,
  vector_dim INTEGER DEFAULT 1536,
  created_at TIMESTAMP
);

-- Collections (organize documents)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP
);

CREATE TABLE document_tags (
  document_id TEXT REFERENCES documents(id),
  tag_id TEXT REFERENCES tags(id),
  PRIMARY KEY (document_id, tag_id)
);

-- Create indices for performance
CREATE INDEX idx_documents_collection ON documents(collection_id);
CREATE INDEX idx_chunks_document ON chunks(document_id);
CREATE INDEX idx_vectors_chunk ON vectors(chunk_id);
CREATE FULLTEXT INDEX fts_chunks ON chunks(content);
```

**Storage Location**:
```
~/.vscode/
├── extensions/
│   └── kb-extension/
│       ├── data/
│       │   ├── kb.db (SQLite)
│       │   ├── cache/
│       │   │   ├── documents/
│       │   │   └── chunks/
│       │   └── config.json
```

#### Qdrant (Vector Database - Local Only)

**Collection Configuration**:
```json
{
  "collection_name": "kb_default",
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  },
  "payload_schema": {
    "chunk_id": { "type": "keyword" },
    "document_id": { "type": "keyword" },
    "collection": { "type": "keyword" },
    "tags": { "type": "array" },
    "source": { "type": "keyword" },
    "created_at": { "type": "integer" },
    "embedding_source": { "type": "keyword" }
  }
}
```

**Storage Architecture** (100% Local, Offline-First):

1. **Primary: Docker Container** (Recommended for MVP):
   - User runs: `docker run -p 6333:6333 qdrant/qdrant:latest`
   - Data stored at: `~/.qdrant/storage` (local file system)
   - All operations local, no network calls
   - Best performance for <10K documents
   - **Cost**: FREE (Docker is free)

2. **Fallback: Embedded SQLite FTS** (No Docker required):
   - If Docker unavailable, use SQLite FTS5 as vector DB equivalent
   - Slower but fully functional
   - Still completely local and offline
   - Can migrate to Docker later

3. **Optional Future: Cloud Sync** (Opt-in only):
   - Users can choose to sync to `cloud.qdrant.io` for multi-device access
   - Not required; all data has local copy first
   - Premium feature, not part of MVP

**All Qdrant operations are LOCAL. No cloud required.**

---

## Data Models

### Document Model

```typescript
interface KBDocument {
  id: string;
  title: string;
  sourcePath: string;
  contentHash: string;
  type: "pdf" | "markdown" | "plaintext" | "docx";
  collection: string;
  tags: string[];
  metadata: {
    author?: string;
    createdAt: Date;
    updatedAt: Date;
    fileSize: number;
    wordCount: number;
  };
  chunks: Chunk[];
}

interface Chunk {
  id: string;
  documentId: string;
  index: number;
  content: string;
  charOffset: number;
  charLength: number;
  vector?: number[]; // 1536D embedding
  metadata: {
    createdAt: Date;
  };
}
```

### Search Context

```typescript
interface SearchContext {
  query: string;
  results: SearchResult[];
  executedAt: Date;
  duration: number; // ms
  totalMatches: number;
}

interface SearchResult {
  documentId: string;
  document: KBDocument;
  chunkId: string;
  chunk: Chunk;
  similarity: number; // 0-1 (for vector search)
  relevanceScore: number; // 0-100
  snippet: string; // Context preview
}
```

---

## Integration Points

### 1. VS Code Extension API

```typescript
// Sidebar WebView panel
const panel = vscode.window.createWebviewPanel(
  "kb-sidebar",
  "Knowledge Base",
  vscode.ViewColumn.Sidebar,
  { enableScripts: true, localResourceRoots: [extensionPath] }
);

// Command palette
vscode.commands.registerCommand("kb.search", async () => {
  const query = await vscode.window.showInputBox({
    prompt: "Search knowledge base..."
  });
  // trigger search
});

// Status bar
const statusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
statusBar.text = `$(search) KB: 234 docs`;

// Settings
const config = vscode.workspace.getConfiguration("kb");
const useLMStudio = config.get("embedding.provider") === "local";
```

### 2. Copilot Chat MCP Integration

```typescript
// In extension initialization
const mcpServer = new MCPServer();

// Define tools for Copilot
mcpServer.defineTool("search_kb", async (params) => {
  const results = await searchService.search({
    type: "hybrid",
    query: params.query,
    limit: params.limit || 5
  });
  return {
    results: results.map(r => ({
      title: r.document.title,
      snippet: r.snippet,
      similarity: r.similarity
    }))
  };
});

// Copilot Chat will use this context
// User → Copilot: "Based on my KB, explain how..."
// Copilot → MCP: search_kb("explain how")
// MCP → Copilot: [relevant chunks + context]
// Copilot → User: [LLM response with KB context]
```

### 3. Document Parsing Pipeline

```typescript
// Support multiple formats
type DocumentFormat = "pdf" | "markdown" | "txt" | "docx";

async function parseDocument(
  filePath: string,
  format: DocumentFormat
): Promise<string> {
  switch(format) {
    case "pdf":
      return await pdfParse(filePath); // pdfjs-dist
    case "markdown":
      return await fs.promises.readFile(filePath, "utf-8");
    case "docx":
      return await docxParse(filePath); // mammoth
    case "txt":
      return await fs.promises.readFile(filePath, "utf-8");
  }
}
```

### 4. Embedding Service Integration (100% Local)

```typescript
// Abstract embedding provider interface
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  isReady(): Promise<boolean>;
  getModelInfo(): { name: string; dimension: number; speed: string };
}

// PRIMARY MVP: Embedded JS Model (@xenova/transformers)
class XenoveEmbedding implements EmbeddingProvider {
  private model: HFTransformer;
  
  async initialize(): Promise<void> {
    // Download model once, cache locally (~60MB)
    this.model = await AutoModel.from_pretrained(
      "Xenova/all-MiniLM-L6-v2",
      { cache_dir: extensionStoragePath }
    );
  }
  
  async embed(text: string): Promise<number[]> {
    // Runs entirely in VS Code process, no API calls
    const result = await this.model.generate({
      inputs: text,
      normalize: true
    });
    return Array.from(result.data); // 384D vector
  }
  
  getModelInfo() {
    return {
      name: "Xenova/all-MiniLM-L6-v2",
      dimension: 384,
      speed: "~150ms per chunk",
      cost: "FREE"
    };
  }
}

// OPTIONAL: Ollama Integration (Phase B, user installs separately)
class OllamaEmbedding implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    // Local HTTP call to Ollama server (localhost:11434)
    const response = await fetch("http://localhost:11434/api/embed", {
      method: "POST",
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text
      })
    });
    const data = await response.json();
    return data.embedding; // 1536D vector
  }
  
  getModelInfo() {
    return {
      name: "nomic-embed-text",
      dimension: 1536,
      speed: "~50ms per chunk",
      cost: "FREE (Ollama is free)"
    };
  }
}

// OPTIONAL: LM Studio Integration (Phase B)
class LMStudioEmbedding implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    // Local HTTP call to LM Studio (localhost:1234)
    const response = await fetch("http://localhost:1234/v1/embeddings", {
      method: "POST",
      body: JSON.stringify({
        model: "local-model",
        input: text
      })
    });
    const data = await response.json();
    return data.data[0].embedding;
  }
}

// Embedding Service Configuration
class EmbeddingService {
  private provider: EmbeddingProvider;
  
  constructor(config: { provider: "xenova" | "ollama" | "lmstudio" }) {
    switch (config.provider) {
      case "ollama":
        this.provider = new OllamaEmbedding();
        break;
      case "lmstudio":
        this.provider = new LMStudioEmbedding();
        break;
      case "xenova": // DEFAULT
      default:
        this.provider = new XenoveEmbedding();
    }
  }
  
  async embed(text: string): Promise<number[]> {
    return this.provider.embed(text);
  }
}

// All providers are LOCAL with zero API calls
```

---

## Implementation Roadmap

### Phase A: MVP (Weeks 1-8)

**Week 1-2: Foundation**
- [ ] Scaffold VS Code extension project
- [ ] Setup SQLite schema
- [ ] Implement storage manager
- [ ] Basic TypeScript config

**Week 3-4: Backend Services**
- [ ] Ingestion service (markdown + plaintext)
- [ ] Qdrant client integration (local mode)
- [ ] Search service (semantic + basic filtering)
- [ ] Error handling & logging

**Week 5-6: Frontend**
- [ ] React Webview sidebar
- [ ] Document browser UI
- [ ] Search results display
- [ ] Document preview pane

**Week 7-8: Integration & Polish**
- [ ] MCP server basic setup
- [ ] Copilot Chat tool integration
- [ ] E2E testing
- [ ] Documentation

**Deliverable**: `kb-extension-0.1.0.vsix` (personal use, 20 KB limit)

---

### Phase B: Growth (Weeks 9-20)

**Features**:
- [ ] PDF + Word document parsing
- [ ] Advanced chunking strategies (semantic)
- [ ] Full-text search optimization
- [ ] Collection management
- [ ] Tag-based filtering
- [ ] Qdrant Cloud integration option
- [ ] Multi-KB support

**Enhancements**:
- [ ] OpenAI embedding provider option
- [ ] Local embedding model (Ollama)
- [ ] Batch ingestion/import
- [ ] Custom system prompts for Copilot

---

### Phase C: Scale (Future)

**Multi-user features**:
- [ ] Team collaboration (shared KBs)
- [ ] Access control & permissions
- [ ] Sync across devices
- [ ] Web UI companion
- [ ] API for external tools

**Performance**:
- [ ] Vectordb sharding (>100K docs)
- [ ] Caching layer
- [ ] Async ingestion queue
- [ ] Incremental indexing

---

## Cost Analysis

### MVP Phase (Monthly)

```
┌─────────────────────────────────────┐
│    Cost Breakdown - MVP (LOCAL)      │
├──────────────────┬─────────────────┤
│ Component        │ Cost            │
├──────────────────┼─────────────────┤
│ VS Code          │ FREE            │
│ Extension        │ FREE            │
│ SQLite (local)   │ FREE            │
│ Qdrant (Docker)  │ FREE            │
│ Embeddings*      │ FREE            │
│ Copilot Chat     │ $20/month**     │
├──────────────────┼─────────────────┤
│ TOTAL            │ $20/month       │
└──────────────────┴─────────────────┘

* @xenova/transformers embedded model
  - ~60MB one-time download
  - Runs entirely in VS Code process
  - Zero API fees
  - Can optionally upgrade to Ollama (still FREE)

** GitHub Copilot Chat subscription (optional)
   - KB extension works standalone without Copilot
   - MCP integration with Copilot is bonus feature
```

**This is COMPLETELY FREE for core KB functionality.**
Optional Copilot Chat integration requires Copilot Pro subscription ($20), but extension works standalone.

### Growth Phase

```
If using Qdrant Cloud:
- Starter tier: $50/month (1GB, 100k search ops/month)
- Additional: +$0.25 per GB/month

If using embedding API:
- Could scale to $10-20/month with heavy usage
- Or switch to local models (free)

Total with Qdrant Cloud: $70-100/month
```

### Cost Optimization Strategies

**Already built-in to this architecture:**
1. ✅ **Use embedded local model** (@xenova/transformers) - no API calls
2. ✅ **Run Qdrant locally** (Docker or SQLite FTS) - no cloud fees
3. ✅ **SQLite local storage** - no database subscriptions
4. ✅ **Zero-cost embeddings** - model runs in-process

**Optional future upgrades (still free):**
- Switch to Ollama for faster embeddings (faster, still free)
- Enable Qdrant Cloud for multi-device sync (optional, paid feature)
- Use Copilot Chat integration (optional, requires $20 Copilot Pro)

**Result**: This architecture is completely free for personal use. No subscriptions or API fees needed.

---

## Security & Best Practices

### Data Privacy

- ✅ **All data stored locally** by default (SQLite + local Qdrant)
- ✅ **No telemetry** without explicit opt-in
- ✅ **API keys** stored in VS Code's secure storage (not plaintext)
- ✅ **Workspace-scoped** (data isolated per VS Code workspace)

### API Key Management

```typescript
// Use VS Code SecretStorage API
const apiKey = await context.secrets.get("kb.openai_key");
if (!apiKey) {
  apiKey = await vscode.window.showInputBox({
    prompt: "Enter OpenAI API key",
    password: true
  });
  await context.secrets.store("kb.openai_key", apiKey);
}
```

### Encryption Considerations

```typescript
// For future cloud sync feature:
import crypto from "crypto";

function encryptDocuments(key: string, documents: KBDocument[]) {
  const cipher = crypto.createCipher("aes-256-cbc", key);
  // encrypt before upload
}
```

### Best Practices

1. **Error Handling**:
   - Graceful degradation on embedding API failures
   - Retry logic with exponential backoff
   - User-friendly error messages

2. **Performance**:
   - Lazy-load large documents
   - Batch Qdrant operations
   - Index SQLite heavily on common queries

3. **Testing**:
   - Unit tests for services (search, ingestion)
   - Integration tests with mock Qdrant
   - E2E tests for UI workflows

4. **Monitoring**:
   - Log ingestion times
   - Track search latency
   - Monitor API usage

---

## Deployment Guide

### Installation (End User)

```bash
# Option 1: Install from VS Code Marketplace
# Search for "KB Extension" and click Install
# That's it! Works immediately offline.

# Option 2: Manual installation
# Download .vsix file and drag-drop into VS Code
```

**Zero configuration needed for MVP.** Extension works out of the box.

### Optional: Enable Better Performance (Ollama)

```bash
# For faster embeddings (optional), user can install Ollama:
# 1. Download Ollama from https://ollama.ai
# 2. Run: ollama pull nomic-embed-text
# 3. Ollama server runs at localhost:11434
# 4. Extension auto-detects and switches to Ollama

# Extension automatically uses Ollama if available,
# otherwise falls back to embedded model (slower but still fast)
```

### Local Development Setup

```bash
# Clone repo
git clone https://github.com/yourusername/kb-extension
cd kb-extension

# Install dependencies
npm install

# Install Qdrant locally (optional for dev, for testing)
docker run -p 6333:6333 qdrant/qdrant:latest

# Run extension in development
npm run watch  # TypeScript compilation
# In VS Code: F5 to launch extension host
```

### Production Build

```bash
# Build
npm run build

# Package .vsix
vsce package

# Publish to VS Code Marketplace
vsce publish

# Or distribute directly
# kb-extension-0.1.0.vsix (works immediately after install)
```

### Configuration (No Setup Required)

```json
// settings.json (users can customize, but defaults work offline)
{
  "kb.embedding.provider": "xenova",  // or "ollama", "lmstudio"
  "kb.embedding.model": "Xenova/all-MiniLM-L6-v2",
  "kb.qdrant.mode": "docker",  // or "sqlite" if Docker unavailable
  "kb.qdrant.url": "http://localhost:6333",
  "kb.chunking.strategy": "paragraph",
  "kb.chunking.size": 512,
  "kb.chunking.overlap": 50
}
```

**Key difference from typical apps:**
- ✅ Works offline immediately after install
- ✅ No API keys needed (embeddings run locally)
- ✅ No cloud account setup required
- ✅ Data never leaves user's machine

---

## Next Steps

1. **Review architecture** with team for feedback
2. **Prioritize MVP features** based on user research
3. **Create detailed implementation plan** for each service
4. **Setup development environment** (Node.js 18+, Qdrant Docker)
5. **Begin Phase A development** with foundation tasks

---

## References

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Anthropic MCP Protocol](https://modelcontextprotocol.io)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [SQLite Best Practices](https://www.sqlite.org/bestpractice.html)
- [LangChain.js Documentation](https://js.langchain.com/)

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Status**: Ready for Development
