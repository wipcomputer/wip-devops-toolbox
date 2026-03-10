###### WIP Computer

[![npm](https://img.shields.io/npm/v/@wipcomputer/universal-installer)](https://www.npmjs.com/package/@wipcomputer/universal-installer) [![CLI / TUI](https://img.shields.io/badge/interface-CLI_/_TUI-black)](https://github.com/wipcomputer/wip-devops-toolbox/blob/main/tools/wip-universal-installer/install.js) [![MCP Server](https://img.shields.io/badge/interface-MCP_Server-black)](https://github.com/wipcomputer/wip-devops-toolbox/blob/main/tools/wip-release/mcp-server.mjs) [![OpenClaw Plugin](https://img.shields.io/badge/interface-OpenClaw_Plugin-black)](https://github.com/wipcomputer/wip-devops-toolbox/blob/main/tools/wip-repo-permissions-hook/openclaw.plugin.json) [![Claude Code Skill](https://img.shields.io/badge/interface-Claude_Code_Skill-black)](https://github.com/wipcomputer/wip-devops-toolbox/blob/main/SKILL.md) [![Claude Code Hook](https://img.shields.io/badge/interface-Claude_Code_Hook-black)](https://github.com/wipcomputer/wip-devops-toolbox/blob/main/tools/wip-file-guard/guard.mjs) [![Universal Interface Spec](https://img.shields.io/badge/Universal_Interface_Spec-black?style=flat&color=black)](https://github.com/wipcomputer/wip-devops-toolbox/blob/main/tools/wip-universal-installer/SPEC.md)

# DevOps Toolbox

## Want your AI to dev? Here's the full system.

Your AI writes code. But does it know how to release it? Check license compliance? Protect your identity files? Sync private repos to public? Follow a real development process?

DevOps Toolbox is the complete toolkit. Built by a team of humans and AIs shipping real software together.

## Teach Your AI to Dev

Open your AI and say:

```
Read the SKILL.md at github.com/wipcomputer/wip-devops-toolbox/blob/main/SKILL.md.

Then explain to me:
1. What are these tools?
2. What do they do?
3. What would they change about how we work together?

Then ask me:
- Do you have more questions?
- Do you want to install them?

If I say yes, run: wip-install wipcomputer/wip-devops-toolbox
```

Your agent will read the repo, explain everything, and walk you through setup interactively.

## DevOps Toolbox Features

Every tool ships as one or more **interfaces:** the ways you and your AI can use it. **CLI** runs in your terminal. **Module** imports into your code. **MCP** connects to any AI that supports Model Context Protocol. **OpenClaw** plugs into the OpenClaw agent platform. **Skill** teaches your AI how to use the tool via a SKILL.md prompt. **CC Hook** runs automatically inside Claude Code on specific events.

**Universal Installer**
- One command installs everything a repo ships. CLI binaries, MCP servers, plugins, hooks. Detects what a repo supports and deploys it all. Toolbox mode walks every sub-tool automatically
- **Interfaces:** CLI, Module, Skill
- *Stable*
- [Read more about Universal Installer](tools/wip-universal-installer/README.md)

**Dev Guide**
- Best practices for AI-assisted development teams. Covers release process, repo structure, branch protection, the `ai/` folder convention, and more
- [Read the Dev Guide](DEV-GUIDE-GENERAL-PUBLIC.md)

**LDM Dev Tools.app**
- macOS automation wrapper. A native .app bundle that runs scheduled jobs (backup, branch protection audit, visibility audit) with Full Disk Access. One app to grant permissions to, one place to add new automation. Scripts can be run standalone without the .app
- *Stable*
- [Read more about LDM Dev Tools.app](tools/ldm-jobs/README.md)

**Release Pipeline**
- One-command releases. Version bump, changelog, SKILL.md sync, npm publish, GitHub release. All in one shot. Never skip a step again
- **Interfaces:** CLI, Module, MCP, Skill
- *Stable*
- [Read more about Release Pipeline](tools/wip-release/README.md)

**License Rug-Pull Detection**
- Scans every dependency for license changes. Blocks merges if a license changed upstream. Daily cron scan. Generates a public compliance dashboard
- **Interfaces:** CLI, Module, MCP, Skill
- *Stable*
- [Read more about License Detection](tools/wip-license-hook/README.md)

**Repo Visibility Guard**
- Blocks repos from going public without a `-private` counterpart. Catches accidental exposure of internal plans, todos, and development context before it happens
- **Interfaces:** CLI, Module, MCP, OpenClaw, Skill, CC Hook
- *Stable*
- [Read more about Repo Visibility Guard](tools/wip-repo-permissions-hook/README.md)

**Identity File Protection**
- Blocks destructive edits to protected identity files. CLAUDE.md, SOUL.md, MEMORY.md, SHARED-CONTEXT.md. Your AI can read them but can't blow them away
- **Interfaces:** CLI, Module, OpenClaw, Skill, CC Hook
- *Stable*
- [Read more about Identity File Protection](tools/wip-file-guard/README.md)

**Repo Manifest Reconciler**
- Single source of truth for repo organization. Like prettier for folder structure. Move folders around all day; on sync, everything snaps back to where the manifest says
- **Interfaces:** CLI, Module, MCP, Skill
- *Stable*
- [Read more about Repo Manifest](tools/wip-repos/README.md)

**Private-to-Public Sync**
- One script syncs your private working repo to a clean public mirror. Excludes internal `ai/` folders automatically. Creates a PR, merges it, cleans up branches
- **Interfaces:** CLI, Skill
- *Stable*
- [Read more about Private-to-Public Sync](tools/deploy-public/SKILL.md)

**Post-Merge Branch Naming**
- Automatically renames merged branches with `--merged-YYYY-MM-DD`. Preserves history without cluttering your branch list
- **Interfaces:** CLI, Skill
- *Stable*
- [Read more about Post-Merge Naming](tools/post-merge-rename/SKILL.md)

## More Info

- [Technical Documentation](TECHNICAL.md) ... Source code locations, build steps, development setup, architecture details
- [Universal Interface Spec](tools/wip-universal-installer/SPEC.md) ... The six interfaces every agent-native tool can ship
- [Dev Guide](DEV-GUIDE-GENERAL-PUBLIC.md) ... Best practices for AI-assisted development

## License

```
MIT    All CLI tools, MCP servers, skills, and hooks (use anywhere, no restrictions).
AGPLv3 Commercial redistribution, marketplace listings, or bundling into paid services.
```

AGPL for personal use is free. Commercial licenses available.

Built by Parker Todd Brooks, Lēsa (OpenClaw, Claude Opus 4.6), Claude Code (Claude Opus 4.6).
