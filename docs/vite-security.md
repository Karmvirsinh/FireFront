# Vite advisory assessment — 2026-10-27

Release-preparation baseline: clean `feature/alpha-lifecycle` at `86b78c8`. The recorded finding is applicable to installed **Vite 8.3.2**, a development dependency. No exploitation or credential exposure was observed or tested. This review did not execute exploit payloads.

## Exact findings and exposure

The registry audit groups six advisories under one high-severity Vite package finding. Each lists Vite **8.3.0–8.3.2** as affected and **8.3.3** as patched in this minor line. Launch-editor is bundled within Vite rather than separately listed in FireFront's lockfile; its affected versions are **≤2.14.1**, patched in **2.14.2**.

| Advisory | Issue and relevance |
| --- | --- |
| [GHSA-587h-7wmj-h5pm / CVE-2026-112942](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | High: Windows launch-editor existence-check bypass, combining with shell escaping weakness. FireFront development runs on Windows, so this is relevant tooling exposure. It is not a simulation or generated-map issue. |
| [GHSA-698v-4r3x-3vcv](https://github.com/vitejs/launch-editor/security/advisories/GHSA-698v-4r3x-3vcv) | Moderate: Windows percent expansion in editor command arguments. Malicious path/environment or alternate-stream preconditions apply; do not infer that an attacker fulfilled them here. |
| [GHSA-r825-w8mm-5pxw](https://github.com/vitejs/launch-editor/security/advisories/GHSA-r825-w8mm-5pxw) | Moderate: editor filenames interpreted as command-line flags. Vite's documented affected combination requires WSL and certain editors; this project uses native Windows Node, with no WSL execution in the verified commands. |
| [GHSA-9jrq-w75r-8gcw](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw) | Low: cross-origin script execution through custom HTML middleware. FireFront uses the default SPA server, external module entry, and no custom transformIndexHtml middleware; the documented affected setup is absent. |
| [GHSA-rq7h-c2jc-7f22](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22) | Moderate: outside-root files exposed when imported project URLs resemble system paths. The advisory requires a non-Windows server, unlike this verified environment. |
| [GHSA-vfpm-58rq-9qcg](https://github.com/vitejs/vite/security/advisories/GHSA-vfpm-58rq-9qcg) | Moderate: wasm error output can reveal the first four bytes of disallowed files. Relevant to running affected Node-based dev servers, subject to file/request accessibility. |

Commands bind development/preview explicitly to `127.0.0.1`, reducing LAN exposure without proving malicious local/browser-origin requests impossible. None of these development middleware/editor endpoints is shipped as a server on static GitHub Pages: Pages receives only built `dist/`. This distinction is not a reason to retain vulnerable development tooling. No broad network binding or security setting was changed.

## Smallest compatible remediation

The [official Vite 8.3.3 release](https://github.com/vitejs/vite/releases/tag/v8.3.3) updates bundled launch-editor to 2.14.2 and fixes HTML URL handling, wasm filesystem checks and safe-module path handling. Official npm metadata retains Node **^20.19.0 || >=22.12.0**, matching FireFront's existing engines. No breaking migration is needed.

Ran `npm.cmd install --save-dev --save-exact vite@8.3.3 --ignore-scripts` against the official npm registry. Only the Vite pin and its lockfile version/resolved URL/integrity changed: **8.3.2 → 8.3.3**. No other package, override, engine or warning threshold changed. Audit suggested latest patch 8.3.5, but the first patched compatible release resolves every listed finding, so unrelated patch changes were avoided. No `npm audit fix --force` was used.

Post-update `npm.cmd audit --json` reports **zero vulnerabilities** across the locked graph (43 entries, including platform-optional packages). This is an audit result at review time, not a guarantee against undisclosed issues. Regression/build/browser release evidence is recorded in progress; historical performance files are retained unchanged. Generated-alpha benchmarking was waived by the user and is not a release criterion. Historical advisory records remain intact and are superseded by this assessment.
