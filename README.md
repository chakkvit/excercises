# Git SDLC Exercise

A small Node app for practising the full software development lifecycle in git —
branch, review, merge, conflict, revert, release, hotfix, rebase, bisect — where
**you can see the result of every git operation in a running app**.

No Docker. No dependencies. Just Node 18+ and git — on **macOS, Linux or Windows**.

## The idea

Every function in this codebase registers itself:

```js
// src/features/greet.js
const { register } = require('../registry');

register('greet', { description: 'Says hello.', author: 'you', addedIn: 'v0.1.0' },
  (who = 'world') => `Hello, ${who}!`);
```

The app renders whatever is in the registry. So:

- merge a feature branch → a new row appears
- `git revert` that merge → the row disappears
- `git checkout` an old tag → the page shows the old feature set
- break a function → the tests fail and `deploy.sh` refuses to ship

Git stops being an abstract log and becomes something you can watch.

## Quick start

```bash
npm run setup      # turn on the pre-commit test hook
npm run deploy     # test → stamp build info → start → health check
```

Then open http://localhost:3000. The repo is already git-initialised with a
single `chore: initial commit` — that is Lab 0.

**If port 3000 is busy** the deploy stops and names the process holding it.
Pick another port:

| Shell | Command |
|---|---|
| macOS / Linux | `PORT=3100 npm run deploy` |
| Windows (PowerShell) | `$env:PORT=3100; npm run deploy` |
| Windows (cmd) | `set PORT=3100 && npm run deploy` |

Then work through **[EXERCISES.md](EXERCISES.md)** — 8 labs, start to finish.

## Commands

Use `npm run ...` everywhere — it works identically on all three platforms.

| Command | What it does |
|---|---|
| `npm start` | Run the app in the foreground (dev) |
| `npm test` | Run the test suite |
| `npm run deploy` | Full local deploy: test, stamp, restart, health-check |
| `npm run status` | Is it running, and on what commit? |
| `npm run logs` | Show the app log |
| `npm run stop` | Stop the app |
| `npm run rollback` | Redeploy the previously deployed commit |

`./deploy.sh` (macOS/Linux) and `deploy.cmd` (Windows) are thin wrappers around
the same `deploy.js`, if you prefer typing those.

## Endpoints

- `/` — the registry page
- `/api/features` — the same thing as JSON
- `/call/greet?arg=Ada` — actually invoke a registered function
- `/health` — used by the deploy health check

## Layout

```
app.js                  HTTP server; renders the registry
src/registry.js         register() / list() / call() — the core
src/features/index.js   auto-loads every *.js beside it
src/features/*.js       one file per feature (add yours here)
src/build-info.js       reads build-info.json written by the deploy
tests/                  node --test, no framework
deploy.js               the local deployment pipeline (cross-platform)
deploy.sh / deploy.cmd  thin wrappers around deploy.js
.githooks/pre-commit    blocks a commit whose tests fail
```

`src/features/` is auto-loaded on purpose. If features had to be listed by hand,
every branch would edit the same list and every merge would conflict in the same
boring place. This way conflicts happen where real conflicts happen — in code two
people actually both changed.


## Cross-platform notes

The pipeline is `deploy.js` — plain Node, no bash — so macOS, Linux and Windows
run the same code. Specifically:

- **Port checks** bind the port to test it rather than shelling out to `lsof`.
- **Stopping the app** uses `SIGTERM` on POSIX and `taskkill /T /F` on Windows,
  which has no real signals.
- **Test discovery** is `node --test` with no arguments, so nothing depends on a
  shell expanding `tests/*.test.js` — `cmd.exe` cannot.
- **`.gitattributes` forces LF**, so a Windows checkout does not rewrite the
  git hook to CRLF and leave `sh` failing with a confusing `\r: not found`.
- **The pre-commit hook** is `#!/usr/bin/env sh`; Git for Windows ships its own
  `sh`, so it runs there too.

### One Windows gotcha the labs will hit

In **PowerShell**, `echo "1.0.0" > VERSION` writes a UTF-16 file with a BOM, and
the deploy will then read a garbled version string. Use one of these instead:

```powershell
Set-Content -Path VERSION -Value "1.0.0" -Encoding utf8 -NoNewline
```

or just run the labs in **Git Bash**, which ships with Git for Windows and
behaves like the macOS/Linux instructions throughout.
