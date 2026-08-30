# The Labs

Eight exercises, in order. Each one ends the same way: **deploy, and look at the
page.** That feedback loop is the whole point — you are not memorising commands,
you are watching what they do to a running system.

Before Lab 1:

```bash
cd git-sdlc-exercise
npm run setup      # enables the pre-commit hook
npm run deploy     # confirm the baseline works
```

The repo already has git initialised with one commit. You should see a single
function, `greet`, at http://localhost:3000.

> **Port 3000 busy?** The deploy stops and names the process holding it. Set
> `PORT` once for your shell and every later command picks it up:
>
> | Shell | Command |
> |---|---|
> | macOS / Linux | `export PORT=3100` |
> | PowerShell | `$env:PORT=3100` |
> | Windows cmd | `set PORT=3100` |
>
> **On Windows**, run the labs in **Git Bash** (ships with Git for Windows) so
> every command below works verbatim. In PowerShell or cmd the git commands are
> identical, but use `npm run deploy` instead of `npm run deploy`, and see the
> PowerShell note in Lab 5.

---

## Lab 1 — Branch, commit, deploy

**Goal:** the basic loop. Never commit to `main` directly again.

```bash
git switch -c feature/uppercase
```

Create `src/features/uppercase.js`:

```js
'use strict';
const { register } = require('../registry');

register('uppercase',
  { description: 'Shouts a string.', author: 'YOUR-NAME', addedIn: 'unreleased' },
  (text = '') => String(text).toUpperCase());
```

```bash
git status                  # untracked file
git add src/features/uppercase.js
git commit -m "feat: add uppercase()"
npm run deploy
```

**Look:** two functions now. Try `curl 'localhost:3000/call/uppercase?arg=hello'`.

**Then:** `git switch main && npm run deploy` — it's gone. Switch back and it returns.
The app is a mirror of whatever commit you are standing on.

> **Check yourself:** what does `git log --oneline --graph --all` show right now?

---

## Lab 2 — Merging: fast-forward vs. `--no-ff`

**Goal:** understand what a merge commit is for.

```bash
git switch main
git merge feature/uppercase          # fast-forward: no merge commit
git log --oneline --graph
```

`main` just slid forward. There is now no record that a branch ever existed.

Do it again, deliberately preserving the history:

```bash
git switch -c feature/reverse
```

Add `src/features/reverse.js` (`reverse` → `[...String(text)].reverse().join('')`),
commit it, then:

```bash
git switch main
git merge --no-ff feature/reverse -m "merge: reverse feature"
git log --oneline --graph
npm run deploy
```

**Look:** three functions, and the graph now has a visible branch-and-join.

> **Discuss:** most teams enforce `--no-ff` on `main`. Why is a merge commit worth
> the extra noise? (Hint: `git revert -m 1 <merge>`, and Lab 4.)

---

## Lab 3 — A real merge conflict

**Goal:** conflicts are not errors. They are git asking a question only you can answer.

Two people change the *same* function. Simulate both:

```bash
git switch -c feature/greet-formal main
```

Edit `src/features/greet.js` → `` `Good day, ${who}.` `` — commit as
`feat: make greet formal`.

```bash
git switch -c feature/greet-casual main
```

Edit the *same line* of `src/features/greet.js` → `` `yo ${who} 👋` `` — commit as
`feat: make greet casual`.

Now merge both:

```bash
git switch main
git merge --no-ff feature/greet-formal -m "merge: formal greeting"
git merge --no-ff feature/greet-casual -m "merge: casual greeting"     # 💥 CONFLICT
```

```bash
git status                  # "both modified"
git diff                    # the conflict markers
```

Open the file. You will see:

```
<<<<<<< HEAD
    (who = 'world') => `Good day, ${who}.`
=======
    (who = 'world') => `yo ${who} 👋`
>>>>>>> feature/greet-casual
```

Pick one, or write a third thing. **Delete all three marker lines.** Then:

```bash
npm test                    # ALWAYS test before concluding a conflict
git add src/features/greet.js
git commit                  # git pre-fills the merge message
npm run deploy
```

**Look:** the greeting on `/call/greet?arg=Ada` is whatever you resolved to.

> **If you panic mid-conflict:** `git merge --abort` puts everything back. It is
> always available before you commit.

---

## Lab 4 — Shipping a bug, and reverting it

**Goal:** `revert` vs. `reset`, and why shared history is never rewritten.

```bash
git switch -c feature/divide
```

Add `src/features/divide.js` with a bug — it ignores division by zero:

```js
register('divide', { description: 'Divides a by b.', author: 'YOUR-NAME', addedIn: 'unreleased' },
  (a, b) => Number(a) / Number(b));
```

Merge it to `main` with `--no-ff` and deploy. Now it's "in production".

Someone reports `/call/divide?arg=1&arg=0` returns `Infinity`. You need it gone **now**:

```bash
git log --oneline           # find the merge commit hash
git revert -m 1 <merge-hash>
npm run deploy
```

**Look:** `divide` is gone from the page — and the history still shows it was
added *and* removed. Nothing was erased.

> **Why not `git reset --hard`?** Reset rewrites history. On a branch only you
> have, that is fine. On `main`, which your teammates have already pulled, it
> forces everyone into a broken state. Revert is a *new commit that undoes* —
> safe to push anywhere.

Also try: `npm run rollback` — redeploys the previously deployed commit
without touching history at all. Two different tools for two different problems.

---

## Lab 5 — Tagging a release

**Goal:** a version is a name for a specific commit.

```bash
git switch main
echo "1.0.0" > VERSION
git add VERSION && git commit -m "chore: bump to 1.0.0"
git tag -a v1.0.0 -m "First release: greet, uppercase, reverse"
npm run deploy
```

**Look:** the "This build" card now reads `v1.0.0` — the deploy prefers an exact
tag over the `VERSION` file.

> **PowerShell users:** `echo "1.0.0" > VERSION` writes UTF-16 with a BOM there,
> and the version will come out garbled. Use
> `Set-Content -Path VERSION -Value "1.0.0" -Encoding utf8 -NoNewline` instead,
> or run the labs in Git Bash.

```bash
git tag                     # list releases
git show v1.0.0             # what exactly shipped
```

> **Try:** `git checkout v1.0.0 && npm run deploy`, then `git switch main`.
> You just deployed a historical release and came back. That is a rollback
> strategy that costs nothing to keep.

---

## Lab 6 — Hotfix off a tag

**Goal:** fix production without shipping unreleased work.

`main` has moved on — add a half-finished feature to it first:

```bash
git switch main
```

Add `src/features/experimental.js` (any function), commit as
`feat: add experimental() (WIP)`. **Do not deploy it.**

Now v1.0.0 has a bug. Branch from the *tag*, not from `main`:

```bash
git switch -c hotfix/greet-typo v1.0.0
```

Fix something in `greet.js`, commit as `fix: correct greeting typo`, then:

```bash
git tag -a v1.0.1 -m "Hotfix: greeting typo"
npm run deploy
```

**Look:** `v1.0.1` is live, and `experimental` is *not* on the page. You shipped
the fix without shipping the WIP.

Now merge the fix forward so it isn't lost:

```bash
git switch main
git merge --no-ff hotfix/greet-typo -m "merge: hotfix v1.0.1 into main"
```

> **The rule:** a hotfix branches from what is *in production*, and merges back
> into *both* the release line and `main`. Forgetting the second half is how a
> bug you already fixed comes back in the next release.

---

## Lab 7 — Cleaning a branch with interactive rebase

**Goal:** make history readable *before* anyone else sees it.

```bash
git switch -c feature/slugify main
```

Make four deliberately messy commits — one per step:

1. add `src/features/slugify.js` → commit `wip`
2. fix a typo in it → commit `oops`
3. finish the function → commit `more wip`
4. add a test for it in `tests/` → commit `feat: add slugify()`

```bash
git log --oneline -4        # embarrassing
git rebase -i HEAD~4
```

In the editor, keep the first line as `pick` and change the other three to
`squash` (or `s`). Save. Git then asks for one combined message — delete the mess
and write:

```
feat: add slugify() to convert titles to url-safe slugs
```

```bash
git log --oneline -1        # one clean commit
npm test
git switch main
git merge --no-ff feature/slugify -m "merge: slugify feature"
npm run deploy
```

> **The rule that keeps you safe:** rebase only commits you have not pushed, or
> that live on a branch nobody else is working on. Rebasing rewrites commit
> hashes — do it to shared history and everyone's clone disagrees with yours.

---

## Lab 8 — `git bisect` to find the breaking commit

**Goal:** let git binary-search your history for you.

Make several commits on `main`, and somewhere in the middle break something —
for example, in one commit change `greet.js` to register the name `'greet '`
(trailing space) so `tests/features.test.js` fails. Keep committing normal
features after it so the break is buried.

```bash
npm test                    # failing now
git bisect start
git bisect bad              # current commit is broken
git bisect good v1.0.0      # this tag was fine
```

Git checks out a commit halfway between. Each time:

```bash
npm test && git bisect good || git bisect bad
```

After a handful of rounds:

```
<hash> is the first bad commit
```

```bash
git bisect reset            # back to where you started
```

**Fix it properly:** branch, fix, test, merge with `--no-ff`, deploy.

> **Automate it:** `git bisect start HEAD v1.0.0` then
> `git bisect run npm test` — git runs the suite at each step by itself. On a
> 500-commit history this finds the culprit in ~9 test runs.

---

## Where to go next

- **Protect `main`:** try making every change via a PR on a real remote
  (`gh repo create`, `gh pr create`). Everything above works identically.
- **`git stash`:** interrupted mid-feature? `git stash`, hotfix, `git stash pop`.
- **`git reflog`:** the safety net. It remembers every commit HEAD has pointed at
  for ~90 days, including ones you thought you destroyed with a bad reset.
- **`git cherry-pick`:** move one commit between release lines without merging
  the whole branch.

## Cheat sheet

| Situation | Command |
|---|---|
| Start work | `git switch -c feature/thing` |
| Undo an uncommitted file | `git restore <file>` |
| Unstage a file | `git restore --staged <file>` |
| Fix the last commit message | `git commit --amend` |
| Bail out of a conflicted merge | `git merge --abort` |
| Undo a *pushed* commit | `git revert <hash>` |
| Undo a *local* commit, keep changes | `git reset --soft HEAD~1` |
| Find a lost commit | `git reflog` |
| See the shape of history | `git log --oneline --graph --all` |
