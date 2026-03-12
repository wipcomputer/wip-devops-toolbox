---
name: wip-license-guard
description: License compliance for your own repos. Ensures correct copyright headers, dual-license blocks, and LICENSE files across all source files.
license: MIT
interface: [cli, skill]
metadata:
  display-name: "License Guard"
  version: "1.0.0"
  homepage: "https://github.com/wipcomputer/wip-ai-devops-toolbox"
  author: "Parker Todd Brooks"
  category: dev-tools
  capabilities:
    - copyright-enforcement
    - license-compliance
    - license-file-check
  requires:
    bins: [node, git]
  openclaw:
    requires:
      bins: [node, git]
    install:
      - id: node
        kind: node
        package: "@wipcomputer/wip-license-guard"
        bins: [wip-license-guard]
        label: "Install via npm"
    emoji: "📜"
---

# wip-license-guard

License compliance for your own repos. Scans source files for correct copyright headers, verifies dual-license blocks (MIT + AGPL), and checks LICENSE files.

## When to Use This Skill

- Before a release, to verify all files have correct license headers
- After adding new source files to a repo
- To enforce the MIT/AGPL dual-license pattern

## CLI

```bash
wip-license-guard /path/to/repo          # scan and report
wip-license-guard /path/to/repo --fix    # auto-fix missing headers
```
