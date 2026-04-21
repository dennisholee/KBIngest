# VS Code KB Extension - Implementation Plan

**Project**: Personal Knowledge Base with Copilot Chat Integration  
**Start Date**: Today  
**MVP Target**: 8 weeks  
**Team Size**: 1-2 developers  

---

## WBS (Work Breakdown Structure)

### Phase A: MVP (Weeks 1-8)

#### Sprint 1: Foundation & Setup (Week 1-2)

**S1.1: Project Initialization**
- [ ] Create VS Code extension scaffold (`yo code kb-extension`)
- [ ] Setup TypeScript compiler config
- [ ] Setup testing framework (Jest/Vitest)
- [ ] Initialize Git repo with .gitignore
- [ ] Create development environment docs

**S1.2: Storage Layer - SQLite**
- [ ] Design database schema (documents, chunks, vectors, collections, tags)
- [ ] Create schema migration system
- [ ] Implement StorageManager class
  - [ ] create() / read() / update() / delete()
  - [ ] Transaction support
  - [ ] Connection pooling
- [ ] Add database initialization & health checks
- [ ] Write unit tests for storage layer

**S1.3: Configuration & Secrets**
- [ ] Setup VS Code settings schema (package.json)
- [ ] Implement ConfigManager
- [ ] Setup SecretStorage for API keys
- [ ] Create settings UI (settings.json support)
- [ ] Environment-based config loading

**Definition of Done**:
- Extension boots without errors
- SQLite initialized and healthy
- Unit tests pass (>80% coverage for storage)
- Settings can be read/written

---

#### Sprint 2: Ingestion & Search (Week 3-4)

**S2.1: Document Parsing**
- [ ] Implement DocumentParser interface
- [ ] Support Markdown parsing
- [ ] Support plaintext parsing
- [ ] Create ChunkingService
  - [ ] Paragraph-based strategy
  - [ ] Configurable chunk size & overlap
  - [ ] Token counting for OpenAI limits
- [ ] Add unit tests for parsers & chunking
- [ ] Benchmark chunking performance

**S2.2: Embedding Integration (100% Local)**
- [ ] Create EmbeddingProvider interface
- [ ] Implement @xenova/transformers provider (PRIMARY MVP)
  - [ ] Download & cache model locally (~60MB)
  - [ ] Batch embedding requests
  - [ ] Error handling for model loading
  - [ ] Performance tuning (threading, caching)
- [ ] Implement Ollama provider (optional stub for Phase B)
- [ ] Implement LM Studio provider (optional stub for Phase B)
- [ ] Add caching layer for embeddings (avoid re-embedding)
- [ ] Unit & integration tests
- [ ] Benchmark: expect ~100-200ms per chunk on modern hardware

**S2.3: Ingestion Workflow**
- [ ] Create IngestionService
  - [ ] Parse → Chunk → Embed → Store pipeline
  - [ ] Progress tracking & UI updates
  - [ ] Error recovery
  - [ ] Deduplication (hash-based)
- [ ] Implement document indexing in SQLite
- [ ] Add logging & diagnostics
- [ ] E2E test: upload document → verify in DB

**S2.4: Search Service**
- [ ] Setup Qdrant client (local mode)
- [ ] Create SearchService
  - [ ] Vector similarity search
  - [ ] Metadata filtering
  - [ ] Result ranking & deduplication
- [ ] Full-text search support (SQLite FTS)
- [ ] Hybrid search combining both
- [ ] Performance testing & optimization
- [ ] Unit tests

**Definition of Done**:
- Can ingest markdown/plaintext documents
- Documents stored in SQLite with metadata
- Vectors stored in local Qdrant
- Search returns relevant results
- All services have >80% test coverage

---

#### Sprint 3: Frontend UI (Week 5-6)

**S3.1: Webview Infrastructure**
- [ ] Create React app for webview
- [ ] Setup communication between Webview ↔ Extension
- [ ] Implement IPC message protocol
- [ ] State management (Redux/Zustand)
- [ ] Styling (Tailwind or CSS Modules)
- [ ] Responsive design

**S3.2: KB Sidebar Component**
- [ ] Document browser (tree view)
  - [ ] Collections expandable tree
  - [ ] Drag-drop to organize
  - [ ] Context menu (delete, tags)
- [ ] Document count & stats
- [ ] Filter & sort options
- [ ] Real-time updates on ingestion

**S3.3: Search UI**
- [ ] Search input with autocomplete
- [ ] Results list with snippet preview
- [ ] Highlight matching terms
- [ ] Sort by relevance/date
- [ ] Load more pagination

**S3.4: Document Preview**
- [ ] Markdown rendering (react-markdown)
- [ ] Syntax highlighting (Prism.js)
- [ ] Metadata panel (tags, created date, word count)
- [ ] Copy content button
- [ ] Full-screen view option

**S3.5: Ingestion UI**
- [ ] Drag-drop zone for documents
- [ ] File browser dialog
- [ ] Batch ingestion progress bar
- [ ] Success/error notifications
- [ ] Cancel operation support

**Definition of Done**:
- UI is responsive & accessible
- All interactions have smooth animations
- No console errors
- E2E tests pass (Cypress/Playwright)

---

#### Sprint 4: MCP & Integration (Week 7-8)

**S4.1: MCP Server Setup**
- [ ] Initialize Anthropic MCP SDK
- [ ] Implement MCP transport (stdio)
- [ ] Define tools schema
- [ ] Implement resource handlers
- [ ] Error handling & validation

**S4.2: MCP Tools**
- [ ] `search_kb` tool
  - [ ] Take query string
  - [ ] Return top-N results with snippets
  - [ ] Include similarity scores
- [ ] `get_document` tool
  - [ ] Get full document by ID
  - [ ] Return formatted text
- [ ] `list_collections` tool
- [ ] `list_recent_documents` tool

**S4.3: Copilot Chat Integration**
- [ ] Configure MCP in Copilot Chat settings
- [ ] Test manual tool invocation
- [ ] Test automatic context injection
- [ ] Create example prompts
- [ ] Write integration test

**S4.4: Polish & Release**
- [ ] Code review & refactoring
- [ ] Performance profiling
  - [ ] Ingestion time benchmarks
  - [ ] Search latency <500ms
  - [ ] Memory usage <200MB
- [ ] Security review
  - [ ] Dependency audit
  - [ ] API key handling
  - [ ] No hardcoded secrets
- [ ] Documentation
  - [ ] README with quick start
  - [ ] API documentation
  - [ ] User guide with screenshots
- [ ] Create CHANGELOG
- [ ] Prepare release notes

**S4.5: Testing & QA**
- [ ] Full end-to-end test suite
- [ ] Manual testing checklist
  - [ ] Windows / macOS / Linux
  - [ ] Different document types
  - [ ] Error scenarios
- [ ] Performance baseline tests
- [ ] Security testing

**Definition of Done**:
- MCP server starts and listens
- Copilot Chat can invoke KB tools
- MVP documentation complete
- Ready for internal alpha testing

---

### MVP Testing Checklist

- [ ] Ingest <100 documents without errors
- [ ] Search returns results in <500ms
- [ ] Memory usage stays <250MB after 100 docs
- [ ] UI responsive on 1440p display
- [ ] No extension crashes over 1-hour use
- [ ] Copilot Chat can search KB successfully
- [ ] Settings can be configured
- [ ] API keys stored securely

---

## Phase B: Growth Features (Weeks 9-20)

### Sprint 5-8: Advanced Features

**Features**:
- [ ] PDF parsing (pdfjs-dist)
- [ ] Word document parsing (mammoth)
- [ ] Semantic chunking (via local LLM)
- [ ] Full-text search optimization (FTS5 enhancements)
- [ ] Advanced filtering UI (date range, tags, collections)
- [ ] Collection management UI
- [ ] Batch import from folder
- [ ] **Ollama integration** (optional performance upgrade, user can install)
  - [ ] Faster embeddings with nomic-embed-text
  - [ ] Automatic fallback if Ollama unavailable
- [ ] LM Studio integration (optional alternative to Ollama)

**Performance**:
- [ ] Implement caching layer for frequent searches
- [ ] Optimize SQLite queries (indices, EXPLAIN QUERY PLAN)
- [ ] Async ingestion queue for large files
- [ ] Background vector DB maintenance

**Integration** (Still Local-First):
- [ ] Qdrant Cloud option (optional sync, not required)
- [ ] Sync settings to VS Code Cloud (optional)
- [ ] Web UI companion (read-only, local browser)
- [ ] CLI tool for bulk operations

---

## Phase C: Scale & Collaboration (Future)

**Multi-user features**:
- [ ] Team KB sharing
- [ ] Access control (owner, editor, viewer)
- [ ] Conflict resolution for edits
- [ ] Change history & versioning

**Technical**:
- [ ] Support 10K+ documents
- [ ] Multi-region Qdrant deployment
- [ ] API for external tools
- [ ] Plugin system for custom importers

---

## Technology Stack Details

### Dependencies (MVP - Local-First)

```json
{
  "dependencies": {
    "vscode": "^1.85.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "sqlite3": "^5.1.6",
    "@qdrant/js-client": "^1.7.0",
    "@xenova/transformers": "^2.6.0",
    "@anthropic-ai/sdk": "^0.6.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "esbuild": "^0.19.8",
    "@vscode/test-electron": "^2.3.8"
  },
  "optionalDependencies": {
    "openai": "^4.20.0",
    "langchain": "^0.1.0"
  }
}
```

**Key changes from typical KB apps:**
- ✅ **@xenova/transformers** - Embeddings run locally in-process (NO API KEY NEEDED)
- ⚠️ **openai** removed from core (optional in Phase B if user wants premium embeddings)
- ✅ **No environment secrets** needed for MVP
- ✅ All local, zero external dependencies

### Development Tools

```bash
# TypeScript compilation
npm run compile

# Watch mode
npm run watch

# Bundle for release
npm run build

# Run tests
npm test
npm run test:coverage

# Run extension in debug mode
npm run debug

# Lint & format
npm run lint
npm run format

# Build .vsix package
vsce package
```

---

## Risk Assessment & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Embedding API costs | Medium | Switch to local models; implement caching |
| Qdrant performance | Medium | Start with local mode; scale gradually |
| Vector dimension mismatch | High | Validate 1536D consistently; add tests |
| SQLite lock contention | Low | Use WAL mode; async operations |
| Copilot Chat breaking changes | Medium | Pin MCP SDK version; monitor releases |
| Large document parsing | Medium | Implement chunk size limits; async processing |

---

## Success Metrics

### MVP (Week 8)

- [ ] Extension installs without errors (100% success rate)
- [ ] Ingestion performance: <1s per document (100 KB average)
- [ ] Search latency: <500ms p95
- [ ] Memory stable: <200MB after 1 hour
- [ ] Copilot integration: tool calls work reliably

### Growth (Week 20)

- [ ] Support 1000+ documents
- [ ] Search latency: <200ms p95 with advanced filtering
- [ ] 10 active beta testers
- [ ] Positive feedback on usability

---

## Deliverables & Milestones

**Week 2 (End of Sprint 1)**:
- Working VS Code extension scaffold
- SQLite database initialized

**Week 4 (End of Sprint 2)**:
- Can ingest documents
- Search works locally
- Integration tests pass

**Week 6 (End of Sprint 3)**:
- Fully functional UI
- All CRUD operations working

**Week 8 (End of Sprint 4) - MVP Release**:
- `kb-extension-0.1.0.vsix` ready
- Copilot Chat integration live
- Documentation complete

---

## Resource Allocation

```
Frontend (React, Webview)       : 30% effort
Backend Services                : 40% effort
Testing & QA                    : 20% effort
DevOps & Release                : 10% effort
```

If team has 1 person: Sequential sprints with 2-week overlap  
If team has 2 people: Parallel frontend/backend development

---

## References

- Qdrant SDK: https://github.com/qdrant/qdrant-client
- VS Code Extension API: https://code.visualstudio.com/api
- Anthropic MCP: https://modelcontextprotocol.io
- LangChain.js: https://js.langchain.com/

---

**Status**: Ready for Sprint Planning  
**Last Updated**: April 2026
