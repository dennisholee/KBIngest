# VS Code KB Extension - Architecture Quick Reference (100% Local)

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND LAYER                                             │
│  • React Webview (Sidebar)                                  │
│  • Document Explorer • Search UI • Preview Pane             │
└─────────────────────────────────────────────────────────────┘
                            ↕ IPC
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Node.js/Extension Host)                 │
│  • Ingestion Service  • Search Service  • MCP Server        │
│  • Embedding (Local @xenova/transformers in-process)        │
│  • 🔒 ALL LOCAL - No API calls required                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌──────────────────┐  ┌──────────────────┐
│  DATA LAYER      │  │  VECTOR DB       │
│  SQLite (Local)  │  │  Qdrant (Local)  │
│  • Documents     │  │  • 384D Vectors  │
│  • Chunks        │  │  • Collections   │
│  • Metadata      │  │  • Payloads      │
│  • FTS Index     │  │  • Runs in       │
│                  │  │    Docker or     │
│                  │  │    Embedded      │
└──────────────────┘  └──────────────────┘

✅ Everything stays LOCAL
✅ ZERO external API calls
✅ Works OFFLINE
✅ 100% FREE
```

---

## Data Flow

### Ingestion Flow (100% Local)
```
User uploads document
    ↓
ParseDocument (format detection)
    [Local in VS Code process]
    ↓
ChunkText (paragraph/semantic strategy)
    [Local text processing]
    ↓
GenerateEmbeddings (local @xenova/transformers)
    [In-process, NO API CALLS, completely offline]
    ↓
StoreInQdrant (local Docker or embedded)
    [Local vector database]
StoreInSQLite (document index + chunk refs)
    [Local SQLite file]
    ↓
UpdateUI (refresh sidebar)
    [Instant local update]

✅ Zero external dependencies
✅ Works completely offline
```

### Search Flow (100% Local)
```
User enters search query
    ↓
SearchService.search()
    ├→ Semantic: embed query locally → Qdrant similarity search (local)
    ├→ Full-text: SQLite FTS query (local)
    └→ Hybrid: combine + rank results (local)
    [All operations local, no network calls]
    ↓
Deduplicate & format results
    [Local processing]
    ↓
Display in UI / Send to Copilot Chat (via MCP)
    [Local MCP server, Copilot runs in VS Code]

✅ <500ms response time (all local)
✅ Works offline
```

### Copilot Chat Integration
```
User: "Based on my KB, explain how..."
    ↓
Copilot Chat receives query
    ↓
Copilot invokes MCP tool: search_kb(query)
    ↓
MCP Server → SearchService.search()
    ↓
Results returned with snippets + similarity scores
    ↓
Copilot uses as context for LLM response
    ↓
User receives answer with KB references
```

---

## Core Classes & Interfaces

### StorageManager
```typescript
class StorageManager {
  // Initialization
  initialize(): Promise<void>
  
  // CRUD
  insertDocument(doc: KBDocument): Promise<string>
  getDocument(id: string): Promise<KBDocument>
  updateDocument(id: string, doc: Partial<KBDocument>): Promise<void>
  deleteDocument(id: string): Promise<void>
  
  // Queries
  listDocuments(filter?: Filter): Promise<KBDocument[]>
  queryChunks(documentId: string): Promise<Chunk[]>
  searchFullText(query: string): Promise<Chunk[]>
}
```

### IngestionService
```typescript
class IngestionService {
  async ingestDocument(
    filePath: string,
    options?: IngestionOptions
  ): Promise<IngestionResult>
  
  async ingestDirectory(
    folderPath: string,
    recursive?: boolean
  ): Promise<IngestionResult[]>
  
  async updateDocument(
    documentId: string,
    filePath: string
  ): Promise<void>
  
  async deleteDocument(documentId: string): Promise<void>
}
```

### SearchService
```typescript
class SearchService {
  async search(query: SearchQuery): Promise<SearchResult[]>
  
  async getSimilarDocuments(
    documentId: string,
    limit?: number
  ): Promise<SearchResult[]>
  
  async getDocumentContext(
    documentId: string,
    maxLength?: number
  ): Promise<string>
}
```

### MCPServer
```typescript
class MCPServer {
  async start(): Promise<void>
  
  defineTool(name: string, handler: ToolHandler): void
  defineResource(name: string, handler: ResourceHandler): void
  
  async handle(request: MCPRequest): Promise<MCPResponse>
}
```

---

## Key Files & Directories

```
kb-extension/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── activation.ts             # Extension lifecycle
│   │
│   ├── storage/
│   │   ├── StorageManager.ts
│   │   ├── migrations.ts
│   │   └── schema.ts
│   │
│   ├── services/
│   │   ├── IngestionService.ts
│   │   ├── SearchService.ts
│   │   ├── EmbeddingService.ts
│   │   └── MCPServer.ts
│   │
│   ├── parsers/
│   │   ├── DocumentParser.ts
│   │   ├── MarkdownParser.ts
│   │   ├── PlaintextParser.ts
│   │   └── PDFParser.ts (Phase B)
│   │
│   ├── chunking/
│   │   ├── Chunker.ts
│   │   ├── ParagraphChunker.ts
│   │   └── SemanticChunker.ts (Phase B)
│   │
│   ├── ui/
│   │   ├── WebviewProvider.ts
│   │   ├── commands.ts
│   │   └── statusBar.ts
│   │
│   ├── webview/              # React frontend
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── KBSidebar.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── DocumentPreview.tsx
│   │   │   └── IngestionUI.tsx
│   │   └── styles/
│   │
│   ├── qdrant/
│   │   ├── QdrantClient.ts
│   │   └── config.ts
│   │
│   ├── config/
│   │   ├── ConfigManager.ts
│   │   └── defaults.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   └── models.ts
│   │
│   └── utils/
│       ├── logger.ts
│       ├── error.ts
│       └── helpers.ts
│
├── test/
│   ├── unit/
│   │   ├── storage.test.ts
│   │   ├── ingestion.test.ts
│   │   └── search.test.ts
│   ├── integration/
│   │   └── e2e.test.ts
│   └── mocks/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API.md
│   └── USER_GUIDE.md
│
├── package.json
├── tsconfig.json
├── webpack.config.js
├── vite.config.js (for webview bundling)
└── .vscodeignore
```

---

## Configuration Schema (package.json)

```json
"contributes": {
  "configuration": {
    "title": "Knowledge Base",
    "properties": {
      "kb.embedding.provider": {
        "type": "string",
        "enum": ["xenova", "ollama", "lmstudio"],
        "default": "xenova",
        "description": "Embedding provider (ALL LOCAL - no API required)"
      },
      "kb.embedding.model": {
        "type": "string",
        "default": "Xenova/all-MiniLM-L6-v2",
        "description": "Embedding model (local model identifier)"
      },
      "kb.qdrant.mode": {
        "type": "string",
        "enum": ["docker", "sqlite"],
        "default": "docker",
        "description": "Qdrant mode (docker=local container, sqlite=embedded fallback)"
      },
      "kb.qdrant.url": {
        "type": "string",
        "default": "http://localhost:6333",
        "description": "Qdrant server URL (local only)"
      },
      "kb.chunking.strategy": {
        "type": "string",
        "enum": ["paragraph", "semantic"],
        "default": "paragraph"
      },
      "kb.chunking.size": {
        "type": "number",
        "default": 512
      },
      "kb.chunking.overlap": {
        "type": "number",
        "default": 50
      }
    }
  },
  "commands": [
    {
      "command": "kb.search",
      "title": "Search Knowledge Base (100% Local)"
    },
    {
      "command": "kb.ingest",
      "title": "Ingest Documents (100% Local)"
    },
    {
      "command": "kb.refresh",
      "title": "Refresh Knowledge Base"
    }
  ],
  "viewsContainers": {
    "activitybar": [
      {
        "id": "kb-explorer",
        "title": "Knowledge Base",
        "icon": "resources/kb.svg"
      }
    ]
  }
}
```

---

## Environment Variables

```bash
# .env.example

# ✅ NO API KEYS NEEDED FOR CORE FUNCTIONALITY
# All embeddings run locally via @xenova/transformers
# No OpenAI API key required

# Optional: Qdrant local connection
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY not needed for local mode

# Optional: Ollama (if user installs for better performance)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=nomic-embed-text

# Optional: LM Studio
LMSTUDIO_URL=http://localhost:1234

# Logging
LOG_LEVEL=debug  # debug, info, warn, error

# Development
NODE_ENV=development
VSCODE_TEST=true
```

**Key point**: No API keys required. Extension works offline immediately after install.

---

## Testing Strategy

### Unit Tests (Services)
```typescript
// test/unit/search.test.ts
describe("SearchService", () => {
  it("should find documents by semantic similarity", async () => {
    const result = await search.search({
      type: "semantic",
      query: "how to deploy",
      limit: 5
    });
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result[0].similarity).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests (Full Pipeline)
```typescript
// test/integration/e2e.test.ts
describe("End-to-End Workflow", () => {
  it("should ingest, index, and search documents", async () => {
    // 1. Ingest document
    await ingest.ingestDocument("./test-docs/sample.md");
    
    // 2. Search
    const results = await search.search({ query: "sample" });
    
    // 3. Verify
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.title).toContain("sample");
  });
});
```

### MCP Tool Tests
```typescript
// test/unit/mcp.test.ts
describe("MCP Tools", () => {
  it("should return search results via MCP", async () => {
    const result = await mcpServer.handleToolCall("search_kb", {
      query: "test query"
    });
    expect(result.results.length).toBeGreaterThan(0);
  });
});
```

---

## Typical Developer Workflow

### Local Development

```bash
# 1. Setup
npm install
docker run -d -p 6333:6333 qdrant/qdrant:latest

# 2. Watch & Compile
npm run watch

# 3. Debug Extension (F5 in VS Code)
# This launches Extension Development Host

# 4. Test Changes
npm test

# 5. Build for release
npm run build
vsce package
```

### Adding a New Feature (e.g., PDF Support)

```bash
# 1. Create parser
src/parsers/PDFParser.ts

# 2. Integrate in DocumentParser.ts
// Add case for .pdf in getParser()

# 3. Add tests
test/unit/pdfParser.test.ts

# 4. Test end-to-end
npm test

# 5. Commit & create PR
git add -A
git commit -m "feat: add PDF document support"
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Document ingestion | <1s per 100KB | Excludes API calls |
| Vector embedding | Dependent on API | ~100 chunks/min with OpenAI |
| Search latency | <500ms p95 | Local Qdrant, 1000 docs |
| Memory usage | <200MB | After 1000 documents |
| Startup time | <2s | Extension activation |

---

## Security Checklist

- [ ] API keys stored in VS Code SecretStorage
- [ ] No credentials in environment variables
- [ ] Dependency audit passes (`npm audit`)
- [ ] No hardcoded URLs or secrets
- [ ] CORS/XSS protection in webview
- [ ] Input validation on all APIs
- [ ] Error messages don't leak sensitive info

---

## Troubleshooting

### Qdrant Connection Issues
```bash
# Check if running
curl http://localhost:6333/health

# Restart container
docker restart <container-id>

# Check logs
docker logs <container-id>
```

### Embedding API Failures
```typescript
// Fallback to local model
if (embedError) {
  const localEmbedding = await localEmbeddingProvider.embed(text);
}
```

### SQLite Lock Errors
```sql
-- Enable WAL mode (faster, fewer locks)
PRAGMA journal_mode=WAL;
PRAGMA wal_autocheckpoint=1000;
```

---

## Useful Links

- [VS Code Extension Guide](https://code.visualstudio.com/api/get-started/your-first-extension)
- [Webview API Best Practices](https://code.visualstudio.com/api/extension-guides/webview)
- [Qdrant Python Client](https://github.com/qdrant/qdrant-client)
- [LangChain Document Loaders](https://js.langchain.com/docs/modules/data_connection/document_loaders/)
- [Anthropic MCP Spec](https://modelcontextprotocol.io/specification)

---

**Last Updated**: April 2026  
**Status**: Ready for Development
