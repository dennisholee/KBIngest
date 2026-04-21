# Quick Reference Guide: Awesome Copilot Resources

## 🎯 Use This Agent When... (Quick Reference)

### Planning & Architecture
| Situation | Agent | Link |
|-----------|-------|------|
| Planning VS Code extension architecture | Custom Agent Foundry | `/agents/custom-agent-foundry.agent.md` |
| Designing multi-file feature changes | Context Architect | `/agents/context-architect.agent.md` |
| Creating implementation roadmap | Implementation Plan | `/agents/implementation-plan.agent.md` |
| Reviewing system design | High Level Big Picture Architect | `/agents/hlbpa.agent.md` |
| Making technical decisions | Principal Software Engineer | `/agents/principal-software-engineer.agent.md` |

### Development
| Situation | Agent | Link |
|-----------|-------|------|
| Building MCP server (TypeScript) | TypeScript MCP Server Expert | `/agents/typescript-mcp-expert.agent.md` |
| Building MCP server (Python) | Python MCP Server Expert | `/agents/python-mcp-expert.agent.md` |
| Building MCP server (Go) | Go MCP Server Expert | `/agents/go-mcp-expert.agent.md` |

### Security & Compliance
| Situation | Agent | Link |
|-----------|-------|------|
| Security code review | SE: Security Reviewer | `/agents/se-security-reviewer.agent.md` |

### Quality Assurance
| Situation | Agent | Link |
|-----------|-------|------|
| Test planning and QA strategy | QA Subagent | `/agents/qa-subagent.agent.md` |

---

## 🎯 Use This Skill When... (Quick Reference)

### Vector Store (Qdrant)
| Task | Skill | File |
|------|-------|------|
| Integrate vector database | Qdrant Clients SDK | `/skills/qdrant-clients-sdk/` |
| Improve search quality | Qdrant Search Quality | `/skills/qdrant-search-quality/` |
| Optimize performance | Qdrant Performance Optimization | `/skills/qdrant-performance-optimization/` |
| Choose deployment | Qdrant Deployment Options | `/skills/qdrant-deployment-options/` |
| Plan scaling | Qdrant Scaling | `/skills/qdrant-scaling/` |

### MCP Server Development
| Task | Skill | File |
|------|-------|------|
| Generate TypeScript MCP server | TypeScript MCP Server Generator | `/skills/typescript-mcp-server-generator/` |
| Generate Python MCP server | Python MCP Server Generator | `/skills/python-mcp-server-generator/` |
| Generate Go MCP server | Go MCP Server Generator | `/skills/go-mcp-server-generator/` |
| Audit MCP security | MCP Security Audit | `/skills/mcp-security-audit/` |

### VS Code Extension
| Task | Skill | File |
|------|-------|------|
| Command development guidelines | vscode-ext-commands | `/skills/vscode-ext-commands/` |
| Localization guidelines | vscode-ext-localization | `/skills/vscode-ext-localization/` |

### Copilot Integration
| Task | Skill | File |
|------|-------|------|
| Build agentic apps with Copilot | Copilot SDK | `/skills/copilot-sdk/` |
| Initial Copilot setup | github-copilot-starter | `/skills/github-copilot-starter/` |
| Create instructions | Copilot Instructions Blueprint Generator | `/skills/copilot-instructions-blueprint-generator/` |
| Add project context | Copilot Spaces | `/skills/copilot-spaces/` |

### Architecture & Documentation
| Task | Skill | File |
|------|-------|------|
| Document architecture | Architecture Blueprint Generator | `/skills/architecture-blueprint-generator/` |
| Document tech stack | Technology Stack Blueprint Generator | `/skills/technology-stack-blueprint-generator/` |
| Create diagrams | Draw IO Diagram Generator | `/skills/draw-io-diagram-generator/` |
| Create code walkthroughs | Code Tour | `/skills/code-tour/` |

### Agent Governance & Security
| Task | Skill | File |
|------|-------|------|
| Add agent governance | Agent Governance | `/skills/agent-governance/` |
| Check OWASP compliance | Agent OWASP Compliance | `/skills/agent-owasp-compliance/` |
| Verify supply chain | Agent Supply Chain | `/skills/agent-supply-chain/` |

### Testing & Quality
| Task | Skill | File |
|------|-------|------|
| Setup eval-based QA | Eval Driven Dev | `/skills/eval-driven-dev/` |
| Improve agent outputs | Agentic Eval | `/skills/agentic-eval/` |
| Establish quality system | Quality Playbook | `/skills/quality-playbook/` |

### Planning & Implementation
| Task | Skill | File |
|------|-------|------|
| Create implementation plan | Create Implementation Plan | `/skills/create-implementation-plan/` |
| Create agent skills | Make Skill Template | `/skills/make-skill-template/` |
| Track development | GitHub Issues | `/skills/github-issues/` |

---

## 📋 Implementation Checklist

### Setup Phase
- [ ] Install `github-copilot-starter` skill
- [ ] Use `Custom Agent Foundry` to plan agents
- [ ] Run `Implementation Plan` agent to create roadmap
- [ ] Use `Architecture Blueprint Generator` for docs

### Development Phase - MCP Server
- [ ] Choose MCP server language (TS/Python/Go)
- [ ] Use appropriate MCP Server Generator skill
- [ ] Run `MCP Security Audit` on configuration
- [ ] Implement tools for KB operations

### Development Phase - Vector Store
- [ ] Use `Qdrant Clients SDK` for integration
- [ ] Run `Qdrant Search Quality` for optimization
- [ ] Use `Qdrant Performance Optimization` for tuning

### Development Phase - Copilot Integration
- [ ] Use `Copilot SDK` skill for chat integration
- [ ] Use `Copilot Instructions Blueprint Generator` for standards
- [ ] Set up `Copilot Spaces` for context management

### Security Phase
- [ ] Run `Agent OWASP Compliance` check
- [ ] Run `SE: Security Reviewer` agent for code review
- [ ] Use `Agent Governance` skill for safety controls
- [ ] Run `MCP Security Audit` on final server

### Quality Phase
- [ ] Setup `Quality Playbook` for system
- [ ] Implement `Eval Driven Dev` for testing
- [ ] Use `Agentic Eval` for agent output quality
- [ ] Create `Code Tour` for onboarding

### Documentation Phase
- [ ] Create diagrams with `Draw IO Diagram Generator`
- [ ] Document KB flow with `Architecture Blueprint Generator`
- [ ] Create walkthroughs with `Code Tour`
- [ ] Create GitHub issues with `GitHub Issues` skill

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Main Site | https://awesome-copilot.github.com/ |
| GitHub Repo | https://github.com/github/awesome-copilot |
| All Agents | https://awesome-copilot.github.com/agents/ |
| All Skills | https://awesome-copilot.github.com/skills/ |
| Tools & MCP | https://awesome-copilot.github.com/tools/ |
| Learning Hub | https://awesome-copilot.github.com/learning-hub/ |
| Contributing | https://github.com/github/awesome-copilot/blob/main/CONTRIBUTING.md |
| AGENTS.md | https://github.com/github/awesome-copilot/blob/main/AGENTS.md |

---

## 💾 Installation Commands

### Install Individual Resources
```bash
# Agents
copilot plugin install custom-agent-foundry@awesome-copilot
copilot plugin install context-architect@awesome-copilot
copilot plugin install implementation-plan@awesome-copilot

# Skills
copilot plugin install qdrant-clients-sdk@awesome-copilot
copilot plugin install typescript-mcp-server-generator@awesome-copilot
copilot plugin install copilot-sdk@awesome-copilot
```

### Register Awesome Copilot Repository
```bash
copilot plugin marketplace add github/awesome-copilot
```

---

## 📊 Resource Categories Summary

### 🤖 Agents (40+ available)
- Extension development (Custom Agent Foundry)
- Architecture planning (HLBPA, Project Architect)
- Language-specific MCP (TypeScript, Python, Go, Java, Rust, etc.)
- Security & QA specialists

### 🎯 Skills (307+ available)
- Vector store integration (Qdrant suite)
- MCP server development (5+ languages)
- VS Code extension development
- Testing & quality assurance
- Architecture documentation
- Agent governance & security

### 🔌 Plugins
- Curated bundles organized by theme
- Pre-configured tool combinations

### 🪝 Hooks
- Automated workflow triggers
- GitHub Actions integration

### 📚 Workflows
- AI-powered GitHub Actions automation
- Agentic workflow patterns

---

## ✅ Verification Checklist

Before starting development:
- [ ] VS Code Copilot Chat extension installed
- [ ] GitHub Copilot subscription active
- [ ] awesome-copilot marketplace registered
- [ ] .copilot folder configured in project
- [ ] Initial agents/skills installed
- [ ] Documentation links bookmarked
- [ ] AWESOME_COPILOT_RECOMMENDATIONS.md reviewed

---

**Note**: All links assume https://github.com/github/awesome-copilot/ as base path
Last updated: April 18, 2026
