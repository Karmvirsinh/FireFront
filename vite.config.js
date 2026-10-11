import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';

function git(...args) {
  try { return execFileSync('git', args, { encoding: 'utf8', windowsHide: true }).trim(); }
  catch { return 'unknown'; }
}

export default defineConfig(({ command }) => ({
  define: { __BUILD_INFO__: JSON.stringify({ commit: git('rev-parse', 'HEAD'),
    branch: git('branch', '--show-current'), uncommitted: git('status', '--short'),
    builtAt: new Date().toISOString(), productionBuild: command === 'build' }) },
}));
