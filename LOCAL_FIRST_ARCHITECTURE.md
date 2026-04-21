# VS Code KB Extension - Local-First Architecture Summary

**Date Updated**: April 18, 2026  
**Status**: ✅ Updated to 100% Local Runtime

---

## Executive Summary

The VS Code KB Extension is designed to run **100% locally within the VS Code extension runtime**. There are **zero external dependencies** required for core functionality.

### Key Guarantees

✅ **100% Local Execution**: All processing happens in VS Code's extension process or on the user's machine  
✅ **Offline Capable**: Works completely offline with no internet connection  
✅ **Zero API Keys Required**: No need for OpenAI, cloud accounts, or subscriptions  
✅ **Privacy First**: All data stays on user's machine  
✅ **Completely Free**: No subscription fees or API costs  

---

## Architecture Layers

### Layer 1: Frontend (VS Code Webview)
```
React UI in Webview
├─ KB Sidebar (document explorer)
├─ Search UI
├─ Document preview
└─ Ingestion interface

✅ Runs entirely in VS Code process
```

### Layer 2: Backend (Extension Host - Node.js)
```
VS Code Extension Process
├─ IngestionService
│  ├─ Document parsing (local)
│  ├─ Text chunking (local)
│  └─ @xenova/transformers embeddings (LOCAL - IN-PROCESS)
├─ SearchService
│  ├─ Qdrant queries (local Docker or embedded)
│  ├─ SQLite FTS queries (local)
│  └─ Result ranking (local)
├─ MCPServer
│  └─ Copilot Chat bridge (local)
└─ StorageManager
   ├─ SQLite operations (local file)
   └─ Cache management (local)

✅ All components run locally, zero network calls for core functionality
```

### Layer 3: Data Storage (Local Files)
```
~/.vscode/extensions/kb-extension/
├─ data/
│  ├─ kb.db (SQLite - metadata, chunks, full-text index)
│  ├─ cache/ (document chunks, parsed content)
│  └─ embeddings/ (cached vector embeddings)
└─ qdrant/ (optional: local Qdrant data if using Docker)

✅ Everything stays on user's machine
```

### Layer 4: Optional Local Services
```
Docker Container (User's Machine)
└─ Qdrant (Vector Database)
   └─ 384D vectors
   └─ Local connection only (localhost:6333)

✅ Entirely optional, but recommended for performance
```

---

## Embedding Generation Pipeline

### MVP: Embedded JavaScript Model

```typescript
// Runs entirely in VS Code extension process - NO API CALLS
1. Document chunk → 
2. @xenova/transformers library (384D model in JavaScript) →
3. Embedding vector (384D)
4. Store in local Qdrant

Performance: ~100-200ms per chunk
Cost: FREE
Setup: Automatic (model cached ~60MB)
```

### Growth Phase: Optional Upgrades

```typescript
// Option A: Qdrant + Ollama (user installs separately)
1. Docker runs Ollama on localhost:11434
2. Embedding request sent to local Ollama server
3. nomic-embed-text model generates 1536D vector
4. Store in local Qdrant

Performance: ~50-100ms per chunk (faster than JS)
Cost: FREE
Setup: User runs `docker pull ollama` and `ollama pull nomic-embed-text`

// Option B: LM Studio (user GUI-based)
1. User runs LM Studio application
2. Embedding endpoint at localhost:1234
3. User-selected embedding model
4. Store in local Qdrant

Performance: Depends on model/hardware
Cost: FREE
Setup: User installs LM Studio desktop app
```

---

## Component Interactions (100% Local)

### Ingest Workflow

```
User uploads document (VS Code File Dialog)
    ↓
DocumentParser (local, format detection)
    ↓
TextChunker (local, paragraph/semantic)
    ↓
EmbeddingService (local @xenova)
    ├→ Embed query vector
    └→ Embed chunk vectors
    ↓
QdrantClient (local connection)
    └→ POST http://localhost:6333/collections/kb/points
    ↓
StorageManager (local SQLite)
    ├→ Insert document record
    ├→ Insert chunk records
    ├→ Insert vector references
    └→ Build FTS index
    ↓
UI Updates (WebView postMessage - local IPC)
    └→ Refresh sidebar, update count

⏱️ Entire flow: ~5-30 seconds (depends on document size)
📍 Completely local, zero network overhead
```

### Search Workflow

```
User enters query in search bar
    ↓
SearchService.search(query)
    ├→ Path 1: Semantic Search
    │  ├─ EmbeddingService.embed(query) [local JS model]
    │  ├─ QdrantClient.search(vector) [local HTTP to Docker]
    │  └─ Results ranked by similarity
    │
    ├→ Path 2: Full-Text Search
    │  ├─ StorageManager.searchFTS(query) [local SQLite]
    │  └─ Results ranked by relevance
    │
    └→ Path 3: Hybrid
       └─ Combine both results with weighted scoring
    ↓
Deduplicate & format results
    ↓
Display in UI or send to Copilot Chat via MCP
    [Local MCP protocol, no external calls]

⏱️ Response time: <500ms p95 (all local operations)
📍 Zero network latency
```

### Copilot Chat Integration

```
Copilot Chat in VS Code (same process)
    ↓
User: "Based on my KB, explain..."
    ↓
Copilot invokes MCP tool via local stdio
    ↓
MCPServer (running in extension)
    ├→ Receives: search_kb(query)
    ├→ Calls: SearchService.search(query) [local]
    └→ Returns: results with snippets
    ↓
Copilot processes with context
    ↓
LLM generates answer
    [Note: LLM call goes to Copilot/OpenAI,
     but KB context is injected locally]

✅ KB searching is 100% local
⚠️ Final LLM response requires Copilot (optional, not required)
```

---

## Data Flow Diagram

```
┌──────────────────┐
│  User (VS Code)  │
└────────┬─────────┘
         │ (File Dialog)
         ↓
    ┌─────────────────────────────────────────────────┐
    │   VS Code Extension Process                     │
    │  ╔═════════════════════════════════════════╗   │
    │  ║  ALL LOCAL OPERATIONS - NO INTERNET    ║   │
    │  ╚═════════════════════════════════════════╝   │
    │                                                 │
    │  1. Document Parser (local)                    │
    │  2. Text Chunker (local)                       │
    │  3. @xenova Embeddings (local in-process)     │
    │  4. Search Service (local)                     │
    │  5. MCP Server (local stdio)                   │
    │  6. UI (React Webview local IPC)               │
    │                                                 │
    │  Storage Layer:                                │
    │  ├─ SQLite DB (~/.vscode/...)                 │
    │  ├─ Document Cache (local)                     │
    │  └─ Embedding Cache (local)                    │
    └──────────┬──────────────────────────────────────┘
               │
    ┌──────────┴────────────┐
    │                       │
    ↓                       ↓
┌─────────────┐    ┌──────────────┐
│ Docker Ctr. │    │ User Machine │
│ (Optional)  │    │   (Backup)   │
│             │    │              │
│ Qdrant      │    │ SQLite FTS   │
│ :6333       │    │ (fallback)   │
└─────────────┘    └──────────────┘
   (Local)            (Local)

✅ Everything on local machine
✅ Qdrant is optional (can use SQLite FTS instead)
```

---

## Network Traffic

### Zero External API Calls (MVP)

```
Extension Process Network Connections:

❌ BLOCKED: External APIs
   ✓ No OpenAI API calls
   ✓ No cloud vector DB calls
   ✓ No telemetry
   ✓ No authentication services

✅ ALLOWED: Local Services Only
   ✓ localhost:6333 (Qdrant - on user's machine)
   ✓ localhost:11434 (Ollama - if user installs)
   ✓ localhost:1234 (LM Studio - if user installs)
   
✅ INTERNAL: Same Machine
   ✓ VS Code extension ↔ Webview (IPC)
   ✓ VS Code extension ↔ SQLite (file system)
   ✓ VS Code extension ↔ Qdrant (localhost)
```

### Optional External (Phase B+)

```
Future Optional Features (User Choice):

⚠️ OPTIONAL: Copilot Chat Integration
   ✓ Copilot invokes local MCP tool
   ✓ LLM response goes to OpenAI (Copilot requirement, not KB)
   ✓ KB context injected locally first

⚠️ OPTIONAL: Qdrant Cloud Sync
   ✓ Multi-device sync to cloud.qdrant.io
   ✓ All data has local copy first
   ✓ Cloud is secondary, not primary
```

---

## Offline Capability

### What Works Offline

✅ **Core Functionality**:
- Ingest documents
- Generate embeddings (local model)
- Store in local vector DB
- Search knowledge base
- Browse documents
- Full-text search

✅ **Performance**: Offline performance is actually FASTER (no network latency)

### What Requires Optional Services

⚠️ **Ollama Integration** (if user enables):
- Requires local Docker
- Requires Ollama running on localhost

⚠️ **Copilot Chat Integration** (if user enables):
- Requires GitHub Copilot Pro
- Requires internet for LLM calls
- BUT: KB searching still works offline, only LLM response requires internet

---

## Cost Breakdown

### MVP (Zero Cost)

```
Component          Cost      Why
─────────────────────────────────────────────
VS Code            FREE      (user has it)
Extension          FREE      (open source)
SQLite             FREE      (embedded)
Qdrant Docker      FREE      (open source container)
@xenova Model      FREE      (open source JS library)
Embeddings         FREE      (runs locally, no API)
Copilot Chat       OPTIONAL  ($20/month for Copilot Pro)
────────────────────────────────────────────
TOTAL              FREE*     (* excluding optional Copilot)
```

### Growth Phase (Still Free)

```
Ollama             FREE      (open source)
LM Studio          FREE      (open source)
Qdrant Cloud       OPTIONAL  ($50+/month for sync)
────────────────────────────────────────────
TOTAL              FREE*     (* excluding optional cloud features)
```

**You literally pay nothing for core KB functionality.**

---

## Deployment Requirements

### Minimum (User's Perspective)

1. ✅ VS Code installed
2. ✅ Install extension from Marketplace
3. ✅ Done - works immediately

**That's it. No setup required.**

### Recommended (Better Performance)

1. ✅ VS Code installed
2. ✅ Install extension from Marketplace
3. ✅ Install Docker (free)
4. ✅ Run: `docker run -p 6333:6333 qdrant/qdrant:latest`
5. ✅ Extension auto-detects local Qdrant

**Setup time: ~5 minutes**

### Optional (Premium Performance)

1. ✅ Install Ollama (free)
2. ✅ Run: `ollama pull nomic-embed-text`
3. ✅ Extension auto-detects and switches to Ollama

**Result: 2-4x faster embeddings, still completely free**

---

## Security & Privacy

### Data Storage
- ✅ All data stored in `~/.vscode/extensions/kb-extension/`
- ✅ User has full control and ownership
- ✅ Can delete anytime
- ✅ No cloud sync by default

### API Keys
- ✅ No API keys required for MVP
- ✅ If using Copilot: keys stored in VS Code SecretStorage
- ✅ No keys in config files or environment variables

### Network
- ✅ All connections are local (localhost)
- ✅ No telemetry
- ✅ No analytics
- ✅ No external API calls without explicit user action

### Open Source
- ✅ Full transparency
- ✅ Community can audit code
- ✅ No vendor lock-in
- ✅ Can fork and modify locally

---

## Comparison Matrix

| Feature | KB Extension | Cloud KB | Copilot Only |
|---------|---|---|---|
| Works Offline | ✅ | ❌ | ❌ |
| Privacy (Local Data) | ✅ | ❌ | ⚠️ |
| Zero Setup | ✅ | ❌ | ✅ |
| Cost | FREE | $$ | $20/mo |
| Customizable Models | ✅ | ❌ | ❌ |
| Multi-Device Sync | ❌* | ✅ | ❌ |
| Team Collaboration | ❌* | ✅ | ❌ |

*Available in Phase B as optional feature

---

## FAQ

**Q: Does this require internet?**  
A: No. Core KB functionality works completely offline. Optional Copilot Chat integration requires internet only for the LLM response, not for KB searching.

**Q: Do I need an OpenAI account?**  
A: No. Embeddings run locally via @xenova/transformers. Zero API costs.

**Q: Can I use my own embedding model?**  
A: Yes! Phase B supports Ollama and LM Studio for custom models.

**Q: Where is my data stored?**  
A: Everything on your machine at `~/.vscode/extensions/kb-extension/data/`. You own it completely.

**Q: Can I sync across devices?**  
A: Phase B will support optional Qdrant Cloud sync, but it's completely optional.

**Q: Is this open source?**  
A: Yes! Full source code available (link TBD).

---

## Next Steps

1. ✅ Review this architecture
2. ✅ Start development with MVP scope
3. ✅ Focus on @xenova embeddings as primary
4. ✅ Build Qdrant Docker setup (not required but recommended)
5. ✅ Test offline functionality
6. ✅ Plan Phase B upgrades (Ollama, Qdrant Cloud)

---

**Status**: Ready for Implementation  
**Scope**: 100% Local, Offline-First, Privacy-Preserving  
**Cost**: Completely Free for Core Functionality
