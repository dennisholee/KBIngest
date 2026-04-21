# GitHub Copilot Awesome-Copilot Recommendations

## Project Overview
Building a VS Code extension that integrates knowledge base creation with vector stores, relational databases, and Copilot Chat integration.

---

## 🤖 Recommended Agents

### Core Extension Development
1. **Custom Agent Foundry**
   - Purpose: Design and create VS Code custom agents with optimal architecture
   - Trigger: When planning VS Code custom agents
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/custom-agent-foundry.agent.md

2. **Context Architect**
   - Purpose: Help plan multi-file changes by identifying relevant context and dependencies
   - Trigger: When refactoring or planning large feature implementations
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/context-architect.agent.md

3. **Implementation Plan**
   - Purpose: Generate implementation plans for new features or refactoring
   - Trigger: When starting feature development or major changes
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/implementation-plan.agent.md

### MCP Server Development
4. **TypeScript MCP Server Expert**
   - Purpose: Expert assistance for building MCP servers in TypeScript
   - Trigger: When developing MCP server for vector/database interactions
   - Skills: Official MCP TypeScript SDK, tool definitions, streaming responses
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/typescript-mcp-expert.agent.md

5. **Python MCP Server Expert**
   - Purpose: Build MCP servers in Python with vector store integration
   - Trigger: If implementing vector store or database MCP server in Python
   - Skills: Official MCP Python SDK, async/await patterns, tool design
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/python-mcp-expert.agent.md

### Architecture & Design
6. **Project Architecture Planner**
   - Purpose: Design holistic architecture evaluating tech stacks and cloud services
   - Trigger: When planning overall system architecture for knowledge base
   - Skills: Architecture diagrams, cost analysis, scalability planning
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/project-architecture-planner.agent.md

7. **High Level Big Picture Architect (HLBPA)**
   - Purpose: System architecture review and documentation
   - Trigger: When reviewing or documenting system design
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/hlbpa.agent.md

### Quality & Security
8. **SE: Security Reviewer**
   - Purpose: Security-focused code review specialist
   - Trigger: For security audit of vector store and database interactions
   - Coverage: OWASP Top 10, Zero Trust principles, LLM security
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/se-security-reviewer.agent.md

9. **Principal Software Engineer**
   - Purpose: Provide principal-level software engineering guidance
   - Trigger: For technical leadership decisions and best practices
   - Source: https://github.com/github/awesome-copilot/blob/main/agents/principal-software-engineer.agent.md

### Testing & QA
10. **QA Subagent**
    - Purpose: Meticulous QA for test planning and implementation verification
    - Trigger: For comprehensive quality assurance strategy
    - Source: https://github.com/github/awesome-copilot/blob/main/agents/qa-subagent.agent.md

---

## 🎯 Recommended Skills

### Extension Development
1. **vscode-ext-commands**
   - Purpose: Guidelines for VS Code extension command development
   - Location: `/skills/vscode-ext-commands/`
   - Use: When implementing extension commands for KB operations
   - Topics: Command naming, visibility, localization

2. **vscode-ext-localization**
   - Purpose: Proper localization for VS Code extensions
   - Location: `/skills/vscode-ext-localization/`
   - Use: When building multi-language support

3. **Copilot SDK**
   - Purpose: Build agentic applications with GitHub Copilot SDK
   - Location: `/skills/copilot-sdk/`
   - Use: When embedding AI agents in your extension
   - Topics: Custom tools, streaming responses, MCP server connection

4. **github-copilot-starter**
   - Purpose: Complete GitHub Copilot configuration for new projects
   - Location: `/skills/github-copilot-starter/`
   - Use: Initial setup of Copilot integration
   - Topics: Configuration, best practices

5. **Copilot Spaces**
   - Purpose: Provide project-specific context to conversations
   - Location: `/skills/copilot-spaces/`
   - Use: When managing knowledge base context

### Vector & Database Integration
6. **Qdrant Clients SDK**
   - Purpose: Vector database client SDK integration
   - Location: `/skills/qdrant-clients-sdk/`
   - Use: For vector store integration
   - Languages: Python, TypeScript, Go, Rust, Java
   - Source: https://awesome-copilot.github.com/skills/

7. **Qdrant Performance Optimization**
   - Purpose: Optimize vector database performance
   - Location: `/skills/qdrant-performance-optimization/`
   - Use: When optimizing search relevance and query performance
   - Topics: Indexing strategies, query optimization

8. **Qdrant Search Quality**
   - Purpose: Diagnose and improve search relevance
   - Location: `/skills/qdrant-search-quality/`
   - Use: When fine-tuning knowledge base search results
   - Topics: Embedding models, hybrid search, reranking

9. **Qdrant Scaling**
   - Purpose: Scale Qdrant deployments
   - Location: `/skills/qdrant-scaling/`
   - Use: When planning production vector store scaling

10. **Qdrant Deployment Options**
    - Purpose: Guide Qdrant deployment selection
    - Location: `/skills/qdrant-deployment-options/`
    - Use: Choosing between local, Docker, cloud deployments

### MCP Server Development
11. **TypeScript MCP Server Generator**
    - Purpose: Generate complete MCP server project in TypeScript
    - Location: `/skills/typescript-mcp-server-generator/`
    - Use: Scaffolding MCP server for KB operations

12. **Python MCP Server Generator**
    - Purpose: Generate complete MCP server project in Python
    - Location: `/skills/python-mcp-server-generator/`
    - Use: If building Python-based MCP server

13. **Go MCP Server Generator**
    - Purpose: Generate complete Go MCP server project
    - Location: `/skills/go-mcp-server-generator/`
    - Use: For performance-critical vector store operations

14. **MCP Security Audit**
    - Purpose: Audit MCP server configurations for security
    - Location: `/skills/mcp-security-audit/`
    - Use: Security validation of MCP server setup
    - Topics: Secrets management, version pinning, injection patterns

15. **MCP Copilot Studio Server Generator**
    - Purpose: Generate MCP server optimized for Copilot Studio integration
    - Location: `/skills/mcp-copilot-studio-server-generator/`
    - Use: When targeting Copilot Studio compatibility

### Architecture & Documentation
16. **Architecture Blueprint Generator**
    - Purpose: Generate detailed architectural documentation
    - Location: `/skills/architecture-blueprint-generator/`
    - Use: Document KB system architecture
    - Output: Diagrams, patterns, implementation guides

17. **Copilot Instructions Blueprint Generator**
    - Purpose: Create comprehensive copilot-instructions.md files
    - Location: `/skills/copilot-instructions-blueprint-generator/`
    - Use: Establish consistent Copilot behavior

18. **Technology Stack Blueprint Generator**
    - Purpose: Generate tech stack documentation
    - Location: `/skills/technology-stack-blueprint-generator/`
    - Use: Document extension tech stack and patterns

19. **Draw IO Diagram Generator**
    - Purpose: Create architecture and flow diagrams
    - Location: `/skills/draw-io-diagram-generator/`
    - Use: Visual documentation of KB system

### Agent Governance & Security
20. **Agent Governance**
    - Purpose: Add governance, safety, and trust controls to AI agents
    - Location: `/skills/agent-governance/`
    - Use: Ensure safe agent behavior in KB operations
    - Topics: Tool restrictions, audit trails, intent classification

21. **Agent OWASP Compliance**
    - Purpose: Check agent compliance with OWASP ASI Top 10
    - Location: `/skills/agent-owasp-compliance/`
    - Use: Security validation of custom agents

22. **Agent Supply Chain**
    - Purpose: Verify supply chain integrity for agent plugins
    - Location: `/skills/agent-supply-chain/`
    - Use: Plugin verification and provenance tracking

### Testing & Quality
23. **Eval Driven Dev**
    - Purpose: Setup eval-based QA for Python LLM applications
    - Location: `/skills/eval-driven-dev/`
    - Use: Quality assurance for KB search and retrieval
    - Coverage: Golden datasets, eval tests, iteration

24. **Agentic Eval**
    - Purpose: Patterns for evaluating and improving AI agent outputs
    - Location: `/skills/agentic-eval/`
    - Use: Self-critique and improvement loops for agents
    - Topics: Rubric-based evaluation, LLM-as-judge

25. **Quality Playbook**
    - Purpose: Generate six quality artifacts for codebase
    - Location: `/skills/quality-playbook/`
    - Use: Establish comprehensive quality system
    - Output: Quality constitution, tests, protocols

### Implementation & Planning
26. **Create Implementation Plan**
    - Purpose: Create detailed implementation plans
    - Location: `/skills/create-implementation-plan/`
    - Use: Planning feature development phases

27. **Code Tour**
    - Purpose: Create CodeTour walkthroughs for code exploration
    - Location: `/skills/code-tour/`
    - Use: Onboarding documentation for extension

28. **Make Skill Template**
    - Purpose: Create new Agent Skills
    - Location: `/skills/make-skill-template/`
    - Use: Building reusable skills for KB operations

### Development Tools
29. **Copilot Instructions Blueprint Generator**
    - Purpose: Create comprehensive copilot-instructions.md
    - Location: `/skills/copilot-instructions-blueprint-generator/`
    - Use: Establish extension development standards

30. **GitHub Issues**
    - Purpose: Create and manage GitHub issues with MCP tools
    - Location: `/skills/github-issues/`
    - Use: Track feature development and bugs

---

## 🔌 Recommended Plugins

### Suggested Plugin Bundles
- **MCP Developer Kit**: Combines MCP server generators, security audit, and SDK skills
- **Vector Store Toolkit**: Qdrant skills + database optimization
- **Copilot Extension Pack**: Copilot SDK + extension commands + instructions
- **Quality Assurance Bundle**: Testing skills + evaluation + quality playbook

---

## 📋 Implementation Priority

### Phase 1: Foundation (Week 1-2)
```
1. github-copilot-starter → Setup Copilot configuration
2. Custom Agent Foundry → Plan extension agents
3. Implementation Plan → Create development roadmap
4. Architecture Blueprint Generator → Document architecture
```

### Phase 2: Core Development (Week 3-4)
```
1. TypeScript MCP Server Generator → Scaffold MCP server
2. Copilot SDK → Integrate Copilot chat
3. Qdrant Clients SDK → Vector store integration
4. MCP Security Audit → Validate MCP security
```

### Phase 3: Integration & Polish (Week 5-6)
```
1. vscode-ext-commands → Implement commands
2. Agent Governance → Add agent safety
3. Quality Playbook → Establish quality standards
4. Code Tour → Create onboarding
```

### Phase 4: Production Ready (Week 7-8)
```
1. Agent OWASP Compliance → Security audit
2. Eval Driven Dev → Quality assurance
3. Draw IO Diagram Generator → Documentation
4. Create GitHub Issues → Track launch items
```

---

## 🚀 Getting Started

### Installation
```bash
# Install individual agents/skills
copilot plugin install custom-agent-foundry@awesome-copilot
copilot plugin install typescript-mcp-expert@awesome-copilot
copilot plugin install qdrant-clients-sdk@awesome-copilot

# Or install recommended plugin bundle
copilot plugin install mcp-developer-kit@awesome-copilot
```

### Initial Setup
1. Visit https://awesome-copilot.github.com for full resource library
2. Read AGENTS.md: https://github.com/github/awesome-copilot/blob/main/AGENTS.md
3. Install VS Code Copilot Chat extension
4. Configure `.copilot` directory in your project
5. Use `Custom Agent Foundry` agent to plan extension architecture

### Key Links
- 🌐 Website: https://awesome-copilot.github.com/
- 📚 Repository: https://github.com/github/awesome-copilot
- 🛠️ Tools & MCP Servers: https://awesome-copilot.github.com/tools/
- 📖 Learning Hub: https://awesome-copilot.github.com/learning-hub/
- 🤝 Contributing: https://github.com/github/awesome-copilot/blob/main/CONTRIBUTING.md

---

## 💡 Key Recommendations

### For Vector Store Integration
- **Priority Skills**: Qdrant Clients SDK, Qdrant Search Quality, Qdrant Performance Optimization
- **Agents**: TypeScript MCP Server Expert, Context Architect
- **Testing**: Eval Driven Dev for search quality validation

### For Relational Database Integration
- **Priority Skills**: SQL Code Review, SQL Optimization, Implementation Plan
- **Agents**: Principal Software Engineer, SE: Security Reviewer
- **Pattern**: Use MCP for database abstraction

### For Copilot Chat Integration
- **Priority Skills**: Copilot SDK, Copilot Spaces, Copilot Instructions Blueprint Generator
- **Agents**: Custom Agent Foundry, Implementation Plan
- **Safety**: Agent Governance, Agent OWASP Compliance

### For Knowledge Base Operations
- **Priority Skills**: Create Implementation Plan, Architecture Blueprint Generator
- **Agents**: Context Architect, Project Architecture Planner
- **Quality**: Quality Playbook, Agentic Eval

---

## 📝 Notes

- All agents and skills are community-maintained and frequently updated
- Repository updates occur regularly (commit history shows activity every 1-2 days)
- Active community with 345+ contributors
- Licensed under MIT License
- Use awesome-copilot.github.com for search across all resources
- Consider contributing your custom agents/skills back to the community

---

**Last Updated**: April 18, 2026
**Source**: https://github.com/github/awesome-copilot
