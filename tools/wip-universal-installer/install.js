#!/usr/bin/env node
// wip-universal-installer/install.js
// Reference installer for agent-native software.
// Reads a repo, detects available interfaces, installs them all.
// Deploys to LDM OS (~/.ldm/extensions/) and OpenClaw (~/.openclaw/extensions/).
// Registers MCP servers at user scope via `claude mcp add --scope user`.
// Maintains a registry at ~/.ldm/extensions/registry.json.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { detectInterfaces, describeInterfaces, detectInterfacesJSON, detectToolbox } from './detect.mjs';

const HOME = process.env.HOME || '';
const LDM_ROOT = join(HOME, '.ldm');
const LDM_EXTENSIONS = join(LDM_ROOT, 'extensions');
const OC_ROOT = join(HOME, '.openclaw');
const OC_EXTENSIONS = join(OC_ROOT, 'extensions');
const OC_MCP = join(OC_ROOT, '.mcp.json');
const REGISTRY_PATH = join(LDM_EXTENSIONS, 'registry.json');

// Flags
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const JSON_OUTPUT = args.includes('--json');
const target = args.find(a => !a.startsWith('--'));

function log(msg) { if (!JSON_OUTPUT) console.log(`  ${msg}`); }
function ok(msg) { if (!JSON_OUTPUT) console.log(`  ✓ ${msg}`); }
function skip(msg) { if (!JSON_OUTPUT) console.log(`  - ${msg}`); }
function fail(msg) { if (!JSON_OUTPUT) console.error(`  ✗ ${msg}`); }

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function writeJSON(path, data) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

// ── Registry ──

function loadRegistry() {
  return readJSON(REGISTRY_PATH) || { _format: 'v1', extensions: {} };
}

function saveRegistry(registry) {
  writeJSON(REGISTRY_PATH, registry);
}

function updateRegistry(name, info) {
  const registry = loadRegistry();
  registry.extensions[name] = {
    ...registry.extensions[name],
    ...info,
    updatedAt: new Date().toISOString(),
  };
  saveRegistry(registry);
}

// ── Install functions ──

function installCLI(repoPath, door) {
  if (DRY_RUN) {
    ok(`CLI: would install globally (dry run)`);
    return true;
  }
  try {
    execSync('npm install -g .', { cwd: repoPath, stdio: 'pipe' });
    const binNames = typeof door.bin === 'string' ? [basename(repoPath)] : Object.keys(door.bin);
    ok(`CLI: ${binNames.join(', ')} installed globally`);
    return true;
  } catch (e) {
    try {
      execSync('npm link', { cwd: repoPath, stdio: 'pipe' });
      ok(`CLI: linked globally via npm link`);
      return true;
    } catch {
      fail(`CLI: install failed. Run manually: cd "${repoPath}" && npm install -g .`);
      return false;
    }
  }
}

function deployExtension(repoPath, name) {
  // Deploy to LDM OS (primary)
  const ldmDest = join(LDM_EXTENSIONS, name);
  if (DRY_RUN) {
    ok(`LDM: would deploy to ${ldmDest} (dry run)`);
    ok(`OpenClaw: would deploy to ${join(OC_EXTENSIONS, name)} (dry run)`);
    return true;
  }

  try {
    // LDM path (remove existing to get clean copy)
    if (existsSync(ldmDest)) {
      execSync(`rm -rf "${ldmDest}"`, { stdio: 'pipe' });
    }
    mkdirSync(ldmDest, { recursive: true });
    cpSync(repoPath, ldmDest, {
      recursive: true,
      filter: (src) => !src.includes('.git') && !src.includes('node_modules') && !src.includes('ai/')
    });
    ok(`LDM: deployed to ${ldmDest}`);

    // Install deps in LDM
    if (existsSync(join(ldmDest, 'package.json'))) {
      try {
        execSync('npm install --omit=dev', { cwd: ldmDest, stdio: 'pipe' });
        ok(`LDM: dependencies installed`);
      } catch {
        skip(`LDM: no deps needed`);
      }
    }

    // OpenClaw path (copy from LDM to keep them identical)
    const ocDest = join(OC_EXTENSIONS, name);
    // Remove existing OC copy to avoid src/dest collision
    if (existsSync(ocDest)) {
      execSync(`rm -rf "${ocDest}"`, { stdio: 'pipe' });
    }
    mkdirSync(ocDest, { recursive: true });
    cpSync(ldmDest, ocDest, { recursive: true });
    ok(`OpenClaw: deployed to ${ocDest}`);

    return true;
  } catch (e) {
    fail(`Deploy failed: ${e.message}`);
    return false;
  }
}

function installOpenClaw(repoPath, door) {
  const name = door.config?.name || basename(repoPath);
  return deployExtension(repoPath, name);
}

function registerMCP(repoPath, door) {
  // Strip npm scope (@org/) from name for claude mcp add compatibility
  const rawName = door.name || basename(repoPath);
  const name = rawName.replace(/^@[\w-]+\//, '');
  const serverPath = join(repoPath, door.file);
  // Use LDM-deployed path if it exists, otherwise repo path
  const ldmServerPath = join(LDM_EXTENSIONS, basename(repoPath), door.file);
  const mcpPath = existsSync(ldmServerPath) ? ldmServerPath : serverPath;

  if (DRY_RUN) {
    ok(`MCP (CC): would register ${name} at user scope (dry run)`);
    ok(`MCP (OC): would add to ${OC_MCP} (dry run)`);
    return true;
  }

  // 1. Register with Claude Code CLI at user scope
  let ccRegistered = false;
  try {
    // Remove first if exists (update behavior)
    try {
      execSync(`claude mcp remove ${name} --scope user`, { stdio: 'pipe' });
    } catch {}
    const envFlag = existsSync(OC_ROOT) ? ` -e OPENCLAW_HOME="${OC_ROOT}"` : '';
    execSync(`claude mcp add --scope user ${name}${envFlag} -- node "${mcpPath}"`, { stdio: 'pipe' });
    ok(`MCP (CC): registered ${name} at user scope`);
    ccRegistered = true;
  } catch (e) {
    // Fallback: write to ~/.claude/.mcp.json
    try {
      const ccMcpPath = join(HOME, '.claude', '.mcp.json');
      const ccMcp = readJSON(ccMcpPath) || { mcpServers: {} };
      ccMcp.mcpServers[name] = {
        command: 'node',
        args: [mcpPath],
      };
      writeJSON(ccMcpPath, ccMcp);
      ok(`MCP (CC): registered ${name} in ~/.claude/.mcp.json (fallback)`);
      ccRegistered = true;
    } catch (e2) {
      fail(`MCP (CC): registration failed. ${e.message}`);
    }
  }

  // 2. Register in OpenClaw's .mcp.json (only if the file already exists)
  if (existsSync(OC_MCP)) {
    try {
      const ocMcp = readJSON(OC_MCP) || { mcpServers: {} };
      ocMcp.mcpServers[name] = {
        command: 'node',
        args: [mcpPath],
      };
      if (existsSync(OC_ROOT)) {
        ocMcp.mcpServers[name].env = { OPENCLAW_HOME: OC_ROOT };
      }
      writeJSON(OC_MCP, ocMcp);
      ok(`MCP (OC): registered ${name} in ${OC_MCP}`);
    } catch (e) {
      fail(`MCP (OC): registration failed. ${e.message}`);
    }
  }

  return ccRegistered;
}

function installClaudeCodeHook(repoPath, door) {
  const settingsPath = join(HOME, '.claude', 'settings.json');
  let settings = readJSON(settingsPath);

  if (!settings) {
    skip(`Claude Code: no settings.json found at ${settingsPath}`);
    return false;
  }

  if (DRY_RUN) {
    ok(`Claude Code: would add ${door.event || 'PreToolUse'} hook (dry run)`);
    return true;
  }

  if (!settings.hooks) settings.hooks = {};
  const event = door.event || 'PreToolUse';

  if (!settings.hooks[event]) settings.hooks[event] = [];

  const hookCommand = door.command || `node "${join(repoPath, 'guard.mjs')}"`;
  const existing = settings.hooks[event].some(entry =>
    entry.hooks?.some(h => h.command === hookCommand)
  );

  if (existing) {
    skip(`Claude Code: ${event} hook already configured`);
    return true;
  }

  settings.hooks[event].push({
    matcher: door.matcher || undefined,
    hooks: [{
      type: 'command',
      command: hookCommand,
      timeout: door.timeout || 10
    }]
  });

  try {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    ok(`Claude Code: ${event} hook added to settings.json`);
    return true;
  } catch (e) {
    fail(`Claude Code: failed to update settings.json. ${e.message}`);
    return false;
  }
}

// ── Single tool install ──

function installSingleTool(toolPath) {
  const { interfaces, pkg } = detectInterfaces(toolPath);
  const ifaceNames = Object.keys(interfaces);

  if (ifaceNames.length === 0) return 0;

  const toolName = pkg?.name?.replace(/^@\w+\//, '') || basename(toolPath);

  if (!JSON_OUTPUT) {
    console.log('');
    console.log(`  Installing: ${toolName}${DRY_RUN ? ' (dry run)' : ''}`);
    console.log(`  ${'─'.repeat(40)}`);
    log(`Detected ${ifaceNames.length} interface(s): ${ifaceNames.join(', ')}`);
    console.log('');
  }

  if (DRY_RUN && !JSON_OUTPUT) {
    console.log(describeInterfaces(interfaces));
    return ifaceNames.length;
  }

  let installed = 0;
  const registryInfo = {
    name: toolName,
    version: pkg?.version || 'unknown',
    source: toolPath,
    interfaces: ifaceNames,
  };

  if (interfaces.cli) {
    if (installCLI(toolPath, interfaces.cli)) installed++;
  }

  // Deploy to LDM + OpenClaw (for plugins or any extension with MCP)
  if (interfaces.openclaw) {
    if (installOpenClaw(toolPath, interfaces.openclaw)) {
      installed++;
      registryInfo.ldmPath = join(LDM_EXTENSIONS, interfaces.openclaw.config?.name || basename(toolPath));
      registryInfo.ocPath = join(OC_EXTENSIONS, interfaces.openclaw.config?.name || basename(toolPath));
    }
  } else if (interfaces.mcp) {
    // Even without openclaw.plugin.json, deploy to LDM for MCP server access
    const extName = basename(toolPath);
    if (deployExtension(toolPath, extName)) {
      registryInfo.ldmPath = join(LDM_EXTENSIONS, extName);
      registryInfo.ocPath = join(OC_EXTENSIONS, extName);
    }
  }

  if (interfaces.mcp) {
    if (registerMCP(toolPath, interfaces.mcp)) installed++;
  }

  if (interfaces.claudeCodeHook) {
    if (installClaudeCodeHook(toolPath, interfaces.claudeCodeHook)) installed++;
  }

  if (interfaces.skill) {
    ok(`Skill: SKILL.md available at ${interfaces.skill.path}`);
    installed++;
  }

  if (interfaces.module) {
    ok(`Module: import from "${interfaces.module.main}"`);
    installed++;
  }

  // Update registry
  if (!DRY_RUN) {
    try {
      mkdirSync(LDM_EXTENSIONS, { recursive: true });
      updateRegistry(toolName, registryInfo);
      ok(`Registry: updated`);
    } catch (e) {
      fail(`Registry: update failed. ${e.message}`);
    }
  }

  return installed;
}

// ── Main ──

async function main() {
  if (!target || target === '--help' || target === '-h') {
    console.log('');
    console.log('  wip-install ... the reference installer for agent-native software');
    console.log('');
    console.log('  Usage:');
    console.log('    wip-install /path/to/repo');
    console.log('    wip-install https://github.com/org/repo');
    console.log('    wip-install org/repo');
    console.log('');
    console.log('  Flags:');
    console.log('    --dry-run   Detect interfaces without installing anything');
    console.log('    --json      Output detection results as JSON');
    console.log('');
    console.log('  Interfaces it detects and installs:');
    console.log('    CLI        ... package.json bin entry -> npm install -g');
    console.log('    Module     ... ESM main/exports -> importable');
    console.log('    MCP Server ... mcp-server.mjs -> claude mcp add --scope user');
    console.log('    OpenClaw   ... openclaw.plugin.json -> ~/.ldm/extensions/ + ~/.openclaw/extensions/');
    console.log('    Skill      ... SKILL.md -> agent instructions');
    console.log('    CC Hook    ... guard.mjs or claudeCode.hook -> ~/.claude/settings.json');
    console.log('');
    console.log('  Modes:');
    console.log('    Single repo  ... installs one tool');
    console.log('    Toolbox      ... detects tools/ subdirectories, installs each sub-tool');
    console.log('');
    console.log('  Paths:');
    console.log('    LDM:       ~/.ldm/extensions/<name>/     (primary, for Claude Code)');
    console.log('    OpenClaw:  ~/.openclaw/extensions/<name>/ (for Lesa/OpenClaw)');
    console.log('    Registry:  ~/.ldm/extensions/registry.json');
    console.log('');
    process.exit(0);
  }

  // Resolve target: GitHub URL, org/repo shorthand, or local path
  let repoPath;

  if (target.startsWith('http') || target.startsWith('git@') || target.match(/^[\w-]+\/[\w.-]+$/)) {
    const url = target.match(/^[\w-]+\/[\w.-]+$/)
      ? `https://github.com/${target}.git`
      : target;
    const repoName = basename(url).replace('.git', '');
    repoPath = join('/tmp', `wip-install-${repoName}`);

    log('');
    log(`Cloning ${url}...`);
    try {
      if (existsSync(repoPath)) {
        execSync(`rm -rf "${repoPath}"`);
      }
      execSync(`git clone "${url}" "${repoPath}"`, { stdio: 'pipe' });
      ok(`Cloned to ${repoPath}`);
    } catch (e) {
      fail(`Clone failed: ${e.message}`);
      process.exit(1);
    }
  } else {
    repoPath = resolve(target);
    if (!existsSync(repoPath)) {
      fail(`Path not found: ${repoPath}`);
      process.exit(1);
    }
  }

  // Check for toolbox mode (tools/ subdirectories with package.json)
  const subTools = detectToolbox(repoPath);

  if (subTools.length > 0) {
    // Toolbox mode: install each sub-tool
    const toolboxPkg = readJSON(join(repoPath, 'package.json'));
    const toolboxName = toolboxPkg?.name?.replace(/^@\w+\//, '') || basename(repoPath);

    if (!JSON_OUTPUT) {
      console.log('');
      console.log(`  Toolbox: ${toolboxName}`);
      console.log(`  ${'═'.repeat(50)}`);
      log(`Found ${subTools.length} sub-tool(s): ${subTools.map(t => t.name).join(', ')}`);
    }

    let totalInstalled = 0;
    let toolsProcessed = 0;

    for (const subTool of subTools) {
      const count = installSingleTool(subTool.path);
      totalInstalled += count;
      if (count > 0) toolsProcessed++;
    }

    if (!JSON_OUTPUT) {
      console.log('');
      console.log(`  ${'═'.repeat(50)}`);
      if (DRY_RUN) {
        console.log(`  Dry run complete. ${toolsProcessed} tool(s) scanned, ${totalInstalled} interface(s) detected.`);
      } else {
        console.log(`  Done. ${toolsProcessed} tool(s), ${totalInstalled} interface(s) processed.`);
      }
      console.log('');
    }
  } else {
    // Single repo mode
    if (JSON_OUTPUT) {
      const result = detectInterfacesJSON(repoPath);
      console.log(JSON.stringify(result, null, 2));
      if (DRY_RUN) process.exit(0);
    }

    const installed = installSingleTool(repoPath);

    if (installed === 0) {
      skip('No installable interfaces detected.');
      process.exit(0);
    }

    if (!JSON_OUTPUT) {
      console.log('');
      if (DRY_RUN) {
        console.log('  Dry run complete. No changes made.');
      } else {
        console.log(`  Done. ${installed} interface(s) processed.`);
      }
      console.log('');
    }
  }
}

main().catch(e => {
  fail(e.message);
  process.exit(1);
});
