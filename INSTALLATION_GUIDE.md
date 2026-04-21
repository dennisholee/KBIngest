# Installing Awesome-Copilot Skills & Agents

## Overview
This guide shows you how to install and enable the recommended GitHub Copilot skills and agents for KBIngest development.

---

## 📋 Installation Methods

### Method 1: VS Code Copilot Chat Extension (Recommended)

#### Step 1: Install Base Extension
1. Open **VS Code**
2. Go to **Extensions** (Cmd+Shift+X)
3. Search for **"GitHub Copilot Chat"**
4. Click **Install**
5. Reload VS Code

#### Step 2: Access Skills & Agents in Chat
1. Open **Copilot Chat** (Cmd+Shift+I)
2. Type `@` to see available agents/skills
3. Type `#` to see available skills for context
4. Start with `@custom-agent-foundry` for planning

### Method 2: Installation via awesome-copilot Marketplace

#### Option A: Through Copilot Chat UI
1. Open **Copilot Chat** panel
2. Click **Settings** (⚙️ icon)
3. Look for **"Awesome-Copilot Marketplace"** option
4. Enable marketplace integration
5. Browse and install skills from the marketplace

#### Option B: Manual Configuration
Create `.copilot/skills.json` in your project:

```json
{
  "marketplace": "awesome-copilot",
  "skills": [
    "github-copilot-starter",
    "vscode-ext-commands",
    "copilot-sdk",
    "qdrant-clients-sdk",
    "typescript-mcp-server-generator",
    "architecture-blueprint-generator",
    "mcp-security-audit",
    "agent-governance",
    "quality-playbook"
  ]
}
```

---

## 🚀 Quick Installation Checklist

### Foundation Skills (Install First)
```
✅ github-copilot-starter      → Initial Copilot setup
✅ vscode-ext-commands          → VS Code extension commands  
✅ copilot-sdk                  → Copilot integration SDK
✅ custom-agent-foundry         → Create custom agents
```

**How to Use:**
- In Copilot Chat, type: `@custom-agent-foundry help with planning my KB extension architecture`

### Vector & Database Skills
```
✅ qdrant-clients-sdk           → Vector store integration
✅ qdrant-search-quality        → Improve search results
✅ qdrant-performance-optimization → Optimize queries
✅ typescript-mcp-server-generator → Create MCP server
✅ mcp-security-audit           → Validate MCP security
```

**How to Use:**
- In Copilot Chat: `@typescript-mcp-expert help me build MCP server for vector store`

### Architecture Skills
```
✅ architecture-blueprint-generator    → Document architecture
✅ draw-io-diagram-generator           → Create diagrams
✅ copilot-instructions-blueprint-generator → Setup conventions
```

**How to Use:**
- In Copilot Chat: `#architecture-blueprint-generator create system architecture for KB`

### Quality & Security
```
✅ agent-governance             → Add safety controls
✅ agent-owasp-compliance       → Security validation
✅ quality-playbook             → Quality framework
✅ se-security-reviewer         → Security audit
```

**How to Use:**
- In Copilot Chat: `@se-security-reviewer audit my vector store integration for security`

---

## 📖 Complete Skills List to Install

### Extension Development (5 skills)
1. `github-copilot-starter` - Initial setup
2. `vscode-ext-commands` - Command development
3. `vscode-ext-localization` - Multi-language support
4. `copilot-sdk` - Copilot integration
5. `copilot-spaces` - Project context

### Vector & Database (6 skills)
6. `qdrant-clients-sdk` - Vector client
7. `qdrant-search-quality` - Search quality
8. `qdrant-performance-optimization` - Performance
9. `qdrant-scaling` - Scale deployments
10. `qdrant-deployment-options` - Deployment guide

### MCP Server Development (4 skills)
11. `typescript-mcp-server-generator` - TypeScript MCP
12. `python-mcp-server-generator` - Python MCP
13. `go-mcp-server-generator` - Go MCP
14. `mcp-security-audit` - Security validation

### Architecture (5 skills)
15. `architecture-blueprint-generator` - Architecture docs
16. `copilot-instructions-blueprint-generator` - Conventions
17. `technology-stack-blueprint-generator` - Tech stack docs
18. `draw-io-diagram-generator` - Diagrams
19. `code-tour` - Code walkthroughs

### Security & Governance (4 skills)
20. `agent-governance` - Agent safety
21. `agent-owasp-compliance` - Security compliance
22. `agent-supply-chain` - Supply chain security
23. `quality-playbook` - Quality framework

### Testing & Quality (2 skills)
24. `eval-driven-dev` - Evaluation-driven testing
25. `agentic-eval` - Agent evaluation

### Tools & Utilities (3 skills)
26. `github-issues` - Issue management
27. `create-implementation-plan` - Planning
28. `make-skill-template` - Create custom skills

---

## 🤖 Key Agents to Use

### Foundation Agents (Start with these)
- `custom-agent-foundry` - Plan KB extension architecture
- `implementation-plan` - Create development roadmap
- `context-architect` - Analyze dependencies

### Development Agents
- `typescript-mcp-expert` - Build MCP server
- `python-mcp-expert` - Python MCP development
- `project-architecture-planner` - System design

### Quality Agents
- `se-security-reviewer` - Security audit
- `qa-subagent` - Quality assurance
- `principal-software-engineer` - Best practices

---

## 🎯 First 5 Tasks After Installation

### Task 1: Verify Installation (5 min)
```
In Copilot Chat:
@custom-agent-foundry
"List all available agents and skills you can access"
```

### Task 2: Plan Architecture (15 min)
```
In Copilot Chat:
@custom-agent-foundry
"Help me design the architecture for a VS Code extension that:
- Ingests documents and stores them in a vector database (Qdrant)
- Stores metadata in PostgreSQL
- Integrates with Copilot Chat for intelligent search
- Provides a knowledge base UI in VS Code"
```

### Task 3: Create Implementation Plan (10 min)
```
In Copilot Chat:
@implementation-plan
"Create a detailed implementation plan for building this KB extension with phases and milestones"
```

### Task 4: Design MCP Server (15 min)
```
In Copilot Chat:
@typescript-mcp-expert
"Generate an MCP server design for knowledge base operations with tools for:
- Ingesting documents
- Searching the vector store
- Getting document context
- Listing documents"
```

### Task 5: Setup Architecture Documentation (10 min)
```
In Copilot Chat:
#architecture-blueprint-generator
"Create architecture documentation for the KB extension with system diagram and component descriptions"
```

---

## 🔗 Quick Reference: Using Skills in Chat

### Format for Skills
```
#skill-name [context or question]
```

### Format for Agents
```
@agent-name [detailed request]
```

### Format for Tools
```
/tool-name [parameters]
```

### Examples
```
# Search with skill
#qdrant-search-quality "How can I improve search relevance for my vector store?"

# Use agent for planning
@implementation-plan "Plan the phases for KB extension development"

# Combined
@typescript-mcp-expert "Using #architecture-blueprint-generator, help me design the MCP server architecture"
```

---

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] Copilot Chat opens (Cmd+Shift+I)
- [ ] Can type `@` and see agents list
- [ ] Can type `#` and see skills list
- [ ] Can successfully run `@custom-agent-foundry help`
- [ ] Can access marketplace in Chat settings
- [ ] Can read QUICK_REFERENCE.md without errors
- [ ] `.copilot/` directory exists in project

---

## 🐛 Troubleshooting

### Issue: Can't see `@` agents in Chat
**Solution:**
1. Make sure Copilot Chat extension is installed
2. Reload VS Code (Cmd+R)
3. Check awesome-copilot marketplace is enabled in settings
4. Restart Copilot Chat

### Issue: "Agent not found" error
**Solution:**
1. Verify agent name spelling (use `-` not `_`)
2. Check you have latest Copilot Chat version
3. In Chat settings, enable "Awesome-Copilot Marketplace"
4. Wait 30 seconds for marketplace to sync

### Issue: Skills not appearing with `#`
**Solution:**
1. Ensure `.copilot/skills.json` exists and has correct JSON
2. Reload VS Code after editing skills.json
3. Try typing skill name directly first: `#skill-name`
4. Check that skills are in awesome-copilot marketplace

### Issue: Commands time out or hang
**Solution:**
1. Check internet connection
2. Try simpler request first (shorter context)
3. Clear Copilot Chat history (restart Chat window)
4. Restart VS Code entirely

---

## 📚 Next Steps

1. **Verify Installation** ✅
   - Open Copilot Chat and confirm agents/skills work

2. **Run Phase 1 Planning** ✅
   - Use `@custom-agent-foundry` to plan architecture

3. **Follow QUICK_REFERENCE.md** ✅
   - Use quick lookup tables for next tasks

4. **Begin Development** ✅
   - Follow 7-phase plan in TECHNICAL_INTEGRATION_GUIDE.md

---

## 📖 Related Documents

- **AWESOME_COPILOT_RECOMMENDATIONS.md** - Full resource list with descriptions
- **QUICK_REFERENCE.md** - Fast lookup tables
- **TECHNICAL_INTEGRATION_GUIDE.md** - Architecture and 7-phase plan
- **README_AWESOME_COPILOT.md** - Master index

---

## 💡 Pro Tips

1. **Start Small** - Try one agent first (custom-agent-foundry)
2. **Read Docs** - Check QUICK_REFERENCE.md before asking
3. **Use Context** - Provide file references for better responses
4. **Iterate** - Run follow-up requests to refine plans
5. **Save Plans** - Copy agent responses to project documentation
6. **Combine Tools** - Use skills AND agents together for best results
7. **Test Incrementally** - Verify each phase works before moving next

---

## 🆘 Getting Help

- **Copilot Chat Help**: Type `help` in any agent
- **Awesome-Copilot Docs**: https://github.com/github/awesome-copilot
- **VS Code Extension API**: https://code.visualstudio.com/api/
- **GitHub Copilot Docs**: https://github.com/features/copilot

---

**Last Updated**: April 18, 2026
**For**: KBIngest VS Code Extension Project
