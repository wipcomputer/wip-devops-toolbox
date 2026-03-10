## v1.6.0: README Rewrite, Dual Licensing, License Guard, Release Notes Standard

Four systems that change how DevOps Toolbox presents itself, protects its licensing, and ships releases. The README is now for humans. Licensing is enforceable. Release notes tell a story.

This release spans PRs #46 through #50 and represents a complete rethink of how we present the toolbox, how we protect its licensing, and how we communicate what each release actually means.

---

### PR #46: License Format Standard

**What we did:** Rewrote the license section across the README and private Dev Guide to use a clear, scannable format that signals both openness and commercial intent.

**Why:** The old license section just said "MIT" in a badge. That's technically correct but it doesn't tell you the full story. We moved to dual licensing (MIT + AGPLv3) and needed a format that makes the distinction immediately clear: use it freely for personal work, need a commercial license if you're bundling it into something you sell.

**What changed:**
- License section switched to a code block format for readability: MIT for all CLI tools, MCP servers, skills, and hooks. AGPLv3 for commercial redistribution, marketplace listings, or bundling into paid services.
- Added "Commercial licenses available" as a one-line signal that this is a real product, not just an open source side project.
- AGPL renamed to AGPLv3 throughout for version specificity. Grok's feedback confirmed this matters for clarity.
- Private Dev Guide (`ai/DEV-GUIDE-private.md`) updated with the licensing standard so every repo going forward follows the same format.
- Fixed "Claude Code CLI" to "Claude Code" in attribution across all files.

**Commits:** `Update license section formatting for readability`, `License section: code block with Grok-style wording`, `License: personal vs commercial distinction, add standard to dev guide`, `License: AGPL -> AGPLv3 for version specificity`

---

### PR #47: LICENSE Files Across All Tools

**What we did:** Updated the actual LICENSE file in the root and all 10 sub-tool directories to dual MIT + AGPLv3.

**Why:** PR #46 changed how we talk about the license. This PR changed the legal documents themselves. Every sub-tool had its own LICENSE file that still said plain MIT. They all needed to match the new dual-license standard, and they needed to match each other exactly.

**What changed:**
- Root `LICENSE` rewritten to dual format. Section 1: MIT (full text). Section 2: GNU Affero General Public License v3.0 (commercial and cloud use). Starts with "Dual License: MIT + AGPLv3" so GitHub's license detection picks it up correctly.
- All 10 `tools/*/LICENSE` files updated to identical dual-license text with correct copyright holder (WIP Computer, Inc.).
- Bottom line on every LICENSE: "AGPLv3 for personal use is free. Commercial licenses available."

**Commits:** `LICENSE files: dual MIT+AGPLv3 on root and all sub-tools`

---

### PR #48: wip-license-guard (New Tool)

**What we did:** Built a new tool that enforces copyright, license format, and README structure across the toolbox.

**Why:** With 10 sub-tools, each needing its own LICENSE file, and a README standard that separates human content from technical content, manual enforcement doesn't scale. We needed a tool that catches drift before it ships. The tool also enforces the README standard from the session's feedback work: no install commands in the README (those go in TECHNICAL.md), no MCP config blocks, no Quick Start sections.

**How it works:**
- Interactive first-run (`wip-license-guard init`) asks for copyright holder, license type (MIT, AGPLv3, or dual MIT+AGPL), year, and attribution. Saves config to `.license-guard.json`.
- `wip-license-guard check` audits the repo against saved config. Checks LICENSE existence, copyright match, AGPLv3 terms (if dual-license), README license section, README structure.
- `wip-license-guard check --fix` auto-repairs: generates missing LICENSE files, updates wrong copyright, creates dual-license text.
- Toolbox-aware: automatically walks every `tools/` subdirectory and checks each sub-tool's LICENSE file.
- README structure standard enforcement: warns if README contains Quick Start sections, `npm install -g` commands, MCP config blocks, or Architecture/API/Config headings that belong in TECHNICAL.md.
- All 14 checks pass on this repo.

**New files:**
- `tools/wip-license-guard/cli.mjs` (268 lines) ... CLI entry point. Commands: `init`, `check`, `check --fix`, `help`.
- `tools/wip-license-guard/core.mjs` ... `generateLicense()` produces MIT, AGPL, or dual MIT+AGPLv3 LICENSE text. `generateReadmeBlock()` produces the README license section.
- `.license-guard.json` ... config: copyright "WIP Computer, Inc.", license "MIT+AGPL", year 2026.

**Interfaces:** CLI, Module. Beta stability.

**Commits:** `Add wip-license-guard tool and .license-guard.json config`

---

### PR #49: SKILL.md v1.5.1

**What we did:** Updated the skill documentation that AI agents read when you say "read the SKILL.md."

**Why:** The SKILL.md was stuck at v1.4.0. It didn't include wip-license-guard (new in this release), didn't have the interface coverage matrix, and used incorrect tool names. When someone tells their AI to read the SKILL.md, it needs to be current and accurate. Stale skill docs mean the AI gives wrong answers about what the tools can do.

**What changed:**
- Version bumped from v1.4.0 to v1.5.1.
- Added interfaces column to tool table: CLI, Module, MCP, OpenClaw, Skill, CC Hook for every tool.
- Added wip-license-guard to the tool list.
- Fixed tool names: `deploy-public` (not `deploy-public.sh`), `post-merge-rename` (not `post-merge-rename.sh`).
- Added "Talk to Your Tools" section with concrete MCP prompts: "Scan all dependencies for license changes" calls `license_scan`. "Check if memory-crystal can go public" calls `repo_permissions_check`. Etc.
- Added license section matching the new README format.
- Updated frontmatter description and capabilities.
- Added SKILL.md staleness warning to wip-release: warns when SKILL.md version falls more than a patch behind the release version, so this can't happen again silently.

**Commits:** `SKILL.md: update to v1.5.1 with full tool table and interfaces`

---

### PR #50: README Rewrite + Release Notes Standard

**What we did:** Rewrote the entire README based on external feedback, and upgraded the release pipeline to enforce narrative release notes.

**Why:** External feedback from Grok and GPT confirmed what we suspected: the README was developer-brain. Install commands, MCP tool mappings, and Quick Start sections front and center. That's what developers write for themselves. It's not what someone landing on the repo needs to see. They want to know: what does this do for me?

The release notes problem came up during this same work. Every release was producing commit lists instead of stories. Parker had to manually rewrite the notes every time. That needed to be fixed at the tooling level.

**README changes:**

The README now follows a strict standard: tagline, "Teach Your AI to Dev" prompt block, features with stability tags, interface coverage matrix, and license. No install commands. No technical implementation details.

- **Removed Quick Start section.** Install commands belong in TECHNICAL.md, not the README. Added a guard in wip-license-guard to catch `npm install -g` commands and Quick Start headings in any README going forward.
- **Removed "Talk to Your Tools" MCP examples.** These are for AIs, not humans. Moved to SKILL.md where they belong.
- **Added Karpathy quote.** The sensor/actuator framing from Andrej Karpathy anchors the Features section. Both paragraphs, "Andrej Karpathy put it clearly:" intro, Source link. This is the future of software: not apps, tools.
- **Added Interface Coverage matrix.** Single table showing all 10 tools and their six possible interfaces. At a glance you can see what ships as CLI, Module, MCP, OpenClaw, Skill, or CC Hook.
- **Added "Can I use this?" section.** Plain-English licensing examples. "Yes, freely:" for personal use. "Need a commercial license:" for bundling into products. Last bullet: "Fork it and send us feedback via PRs (we'd love that)."
- **Added License Guard to features list.** New tool from PR #48 needed to be in the features section.

**Release pipeline changes:**

Three changes to `wip-release` that make release notes a first-class part of the process:

1. **Quality warning.** When `--notes` is missing, too short (under 50 characters), or looks like a changelog entry (starts with "fix:", "add:", "update:"), wip-release warns: "Explain what was built, why, and why it matters."

2. **`--notes-file` flag.** Pass a markdown file with the full release narrative: `wip-release minor --notes-file=RELEASE-NOTES-v{version}.md`. This is how you write proper release notes and review them before they go live.

3. **Commits fold under narrative.** Commit history is still included, but inside a collapsible `<details>` section labeled "What changed (commits)". The narrative is the headline. The commits are supporting detail.

**New convention:** `RELEASE-NOTES-v{version}.md` lives on the feature branch. It's part of the PR diff. You review the release notes alongside the code. When the PR merges, `wip-release` reads from the file. The notes you approved are the notes that ship.

**Files changed:**
- `README.md` ... full rewrite
- `TECHNICAL.md` ... received Quick Start and npm install commands from README
- `tools/wip-release/core.mjs` ... `buildReleaseNotes()` restructured, new `warnIfNotesAreThin()`
- `tools/wip-release/cli.js` ... new `--notes-file=path` flag
- `tools/wip-license-guard/cli.mjs` ... README structure standard checks added
- `RELEASE-NOTES-v{version}.md` ... new convention file
- `ai/notes/2026-03-10--grok-feedback--readme-and-licensing.md` ... Grok feedback documented
- `ai/notes/2026-03-10--gpt-feedback--product-and-adoption.md` ... GPT feedback documented
- `ai/plan/current/2026-03-10--cc-mini--readme-polish-and-mcp-examples.md` ... 7-phase plan, all complete

**Commits:** `Add feedback notes, plan for README polish + MCP examples`, `README: golden path, MCP examples, interface matrix, license examples`, `Plan: mark phases 1-5 as DONE`, `README: add Karpathy quote on tools vs apps`, `wip-license-guard: add README structure standard checks`, `Move Quick Start to TECHNICAL.md, guard against install commands in README`, `Remove Talk to Your Tools section from README`, `README: full Karpathy argument with both quotes and source link`, `License: replace cloud instances bullet with fork/PR invitation`, `Karpathy quote: remove headline, inline attribution, semicolon`, `Fix Karpathy quote format: intro line, source outside blockquote`, `wip-release: narrative release notes standard`, `Add RELEASE-NOTES-v{version}.md for PR review`

---

### Install

```bash
npm install -g @wipcomputer/universal-installer
wip-install wipcomputer/wip-devops-toolbox
```

Or update your local clone:
```bash
git pull origin main
```

---

Built by Parker Todd Brooks, Lēsa (OpenClaw, Claude Opus 4.6), Claude Code (Claude Opus 4.6).
