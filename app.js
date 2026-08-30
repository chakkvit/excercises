'use strict';

const http = require('node:http');
const registry = require('./src/registry');
const features = require('./src/features');
const buildInfo = require('./src/build-info');

const PORT = Number(process.env.PORT) || 3000;

const loadedFiles = features.loadAll();
const build = buildInfo.read();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderPage() {
  const items = registry.list();

  const rows = items.length === 0
    ? `<tr><td colspan="4" class="empty">No functions registered. Add a file to <code>src/features/</code>.</td></tr>`
    : items.map((f) => `
        <tr>
          <td><code class="fn">${escapeHtml(f.name)}()</code></td>
          <td>${escapeHtml(f.description)}</td>
          <td>${escapeHtml(f.author)}</td>
          <td><span class="tag">${escapeHtml(f.addedIn)}</span></td>
        </tr>`).join('');

  const deployedAt = build.deployedAt
    ? new Date(build.deployedAt).toLocaleString()
    : 'never (dev run)';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Function Registry</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #f6f7f9; --card: #ffffff; --ink: #14171a; --muted: #5b6572;
    --line: #e3e7ec; --accent: #2f6feb; --chip: #eef2f8;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14171a; --card: #1c2024; --ink: #e9edf2; --muted: #9aa4b1;
      --line: #2b3238; --accent: #6ea8ff; --chip: #262c33;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2.5rem 1.25rem; background: var(--bg); color: var(--ink);
    font: 15px/1.55 ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .wrap { max-width: 900px; margin: 0 auto; }
  h1 { margin: 0 0 .25rem; font-size: 1.6rem; letter-spacing: -.02em; }
  .sub { color: var(--muted); margin: 0 0 1.75rem; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  .card + .card { margin-top: 1.25rem; }
  .card h2 { margin: 0; padding: .9rem 1.1rem; font-size: .8rem; text-transform: uppercase;
             letter-spacing: .08em; color: var(--muted); border-bottom: 1px solid var(--line); }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; min-width: 560px; }
  th, td { text-align: left; padding: .75rem 1.1rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; }
  tr:last-child td { border-bottom: 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .88em; }
  .fn { color: var(--accent); font-weight: 600; }
  .tag { background: var(--chip); border-radius: 999px; padding: .12rem .55rem; font-size: .78rem; color: var(--muted); }
  .empty { color: var(--muted); text-align: center; padding: 2rem 1rem; }
  dl { margin: 0; padding: .9rem 1.1rem; display: grid; grid-template-columns: max-content 1fr; gap: .45rem 1.25rem; }
  dt { color: var(--muted); font-size: .82rem; }
  dd { margin: 0; }
  .count { float: right; text-transform: none; letter-spacing: 0; }
  footer { color: var(--muted); font-size: .82rem; margin-top: 1.75rem; text-align: center; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Function Registry</h1>
  <p class="sub">Everything this codebase currently knows how to do. Merge a branch, redeploy, refresh.</p>

  <div class="card">
    <h2>Registered functions <span class="count">${items.length} loaded from ${loadedFiles.length} file(s)</span></h2>
    <div class="scroll">
      <table>
        <thead><tr><th>Function</th><th>Description</th><th>Author</th><th>Added in</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <h2>This build</h2>
    <dl>
      <dt>Version</dt><dd><code>${escapeHtml(build.version)}</code></dd>
      <dt>Branch</dt><dd><code>${escapeHtml(build.branch)}</code></dd>
      <dt>Commit</dt><dd><code>${escapeHtml(build.commit)}</code></dd>
      <dt>Subject</dt><dd>${escapeHtml(build.subject)}</dd>
      <dt>Deployed</dt><dd>${escapeHtml(deployedAt)}</dd>
    </dl>
  </div>

  <footer>GET <code>/api/features</code> for JSON &middot; GET <code>/health</code> for the deploy health check</footer>
</div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', features: registry.count(), version: build.version }));
    return;
  }

  if (url.pathname === '/api/features') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      build,
      features: registry.list().map(({ fn, ...rest }) => rest),
    }, null, 2));
    return;
  }

  // Try a registered function out: /call/greet?arg=Ada
  if (url.pathname.startsWith('/call/')) {
    const name = decodeURIComponent(url.pathname.slice('/call/'.length));
    try {
      const result = registry.call(name, ...url.searchParams.getAll('arg'));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ name, result }));
    } catch (err) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderPage());
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`[app] listening on http://localhost:${PORT}`);
  console.log(`[app] ${registry.count()} function(s) registered from ${loadedFiles.length} file(s)`);
  console.log(`[app] build ${build.version} @ ${build.commit} (${build.branch})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n[app] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
