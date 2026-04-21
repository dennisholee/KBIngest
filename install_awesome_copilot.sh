#!/bin/bash

echo "🚀 Installing GitHub Awesome-Copilot Recommended Skills & Agents"
echo "================================================================"
echo ""

# Function to install a plugin
install_plugin() {
    local plugin=$1
    local type=${2:-skill}
    echo "📦 Installing $type: $plugin"
    copilot plugin install "$plugin@awesome-copilot" 2>/dev/null || echo "  ⚠️  Note: Run 'copilot plugin install $plugin@awesome-copilot' if this failed"
}

# Phase 1: Foundation Skills (Install First)
echo ""
echo "▶️  PHASE 1: Foundation Skills"
echo "────────────────────────────"
install_plugin "github-copilot-starter" "skill"
install_plugin "vscode-ext-commands" "skill"
install_plugin "copilot-sdk" "skill"

# Agents
echo ""
echo "▶️  Core Agents"
echo "────────────────────────────"
install_plugin "custom-agent-foundry" "agent"
install_plugin "implementation-plan" "agent"
install_plugin "context-architect" "agent"

# Phase 2: Vector & Database Skills
echo ""
echo "▶️  PHASE 2: Vector Store & Database Skills"
echo "────────────────────────────"
install_plugin "qdrant-clients-sdk" "skill"
install_plugin "qdrant-search-quality" "skill"
install_plugin "qdrant-performance-optimization" "skill"
install_plugin "qdrant-scaling" "skill"
install_plugin "qdrant-deployment-options" "skill"

# Phase 2: MCP Server Skills
echo ""
echo "▶️  MCP Server Development Skills"
echo "────────────────────────────"
install_plugin "typescript-mcp-server-generator" "skill"
install_plugin "python-mcp-server-generator" "skill"
install_plugin "mcp-security-audit" "skill"

# MCP Agents
echo ""
echo "▶️  MCP Server Agents"
echo "────────────────────────────"
install_plugin "typescript-mcp-expert" "agent"
install_plugin "python-mcp-expert" "agent"

# Phase 3: Architecture & Documentation Skills
echo ""
echo "▶️  PHASE 3: Architecture & Documentation Skills"
echo "────────────────────────────"
install_plugin "architecture-blueprint-generator" "skill"
install_plugin "copilot-instructions-blueprint-generator" "skill"
install_plugin "technology-stack-blueprint-generator" "skill"
install_plugin "draw-io-diagram-generator" "skill"
install_plugin "code-tour" "skill"

# Architecture Agents
echo ""
echo "▶️  Architecture Agents"
echo "────────────────────────────"
install_plugin "project-architecture-planner" "agent"

# Phase 4: Security, Governance & Quality Skills
echo ""
echo "▶️  PHASE 4: Security, Governance & Quality Skills"
echo "────────────────────────────"
install_plugin "agent-governance" "skill"
install_plugin "agent-owasp-compliance" "skill"
install_plugin "quality-playbook" "skill"
install_plugin "eval-driven-dev" "skill"
install_plugin "agentic-eval" "skill"

# Quality & Security Agents
echo ""
echo "▶️  Quality & Security Agents"
echo "────────────────────────────"
install_plugin "se-security-reviewer" "agent"
install_plugin "qa-subagent" "agent"
install_plugin "principal-software-engineer" "agent"

# Additional Useful Skills
echo ""
echo "▶️  Additional Tools"
echo "────────────────────────────"
install_plugin "copilot-spaces" "skill"
install_plugin "github-issues" "skill"

echo ""
echo "✅ Installation Complete!"
echo "================================================================"
echo ""
echo "Next steps:"
echo "  1. Run: copilot plugin list"
echo "  2. Open QUICK_REFERENCE.md for plugin usage guide"
echo "  3. Start Phase 1 planning with Custom Agent Foundry"
echo ""
