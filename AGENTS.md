# Git standards

Canonical for this repo and for `adaptive-llm-agent`. Both repos follow the
same rules; where they differ it is called out.

Every rule below exists because the thing it prevents already happened. The
diagram is the least important part of this document.

## Branches

Three tiers. Read left to right as parent -> child (what each is cut from):

```
main
 └── staging/<version>        integration, e.g. staging/v1
      └── feature/<name>      one shippable change, e.g. feature/mcp-tool-client
```

- **`staging/<version>`** is cut from `main`. Everything transits it.
- **`feature/<name>`** (also `fix/<name>`, `docs/<name>`) is cut from
  `staging/<version>`. Not namespaced by version — one version is in flight at
  a time.
- When a new version starts, cut `staging/v2` from `main`. The old
  `staging/v1` is promoted and retired.

There is deliberately **no separate version tier** between staging and main. It
was specified once and never used: the `v1` branch never diverged from `main`
by a single commit, this repo never created one at all, and zero
`feature/v1/*` branches ever existed. Add it back only if two versions are
genuinely in flight at once.

### Never merge a feature straight into `main`

Bypassing staging is what produced the worst merge in this repo's history.
`feature/mcp-tool-client` went into `main` directly while `staging/v1` grew the
generic CRUD tool. Both sides independently invented a `CompositeToolProvider`
— byte-for-byte the same class — and the branches sat 9 ahead / 3 behind until
someone merged them by hand. Nothing about that was mechanical.

### Claim a branch by pushing it empty

```sh
git checkout -b feature/x staging/v1 && git push -u origin feature/x
```

Before writing a line. Two agents once built the same landing page on two
branches — roughly a thousand lines, one thrown away — because each checked for
existing work before the other had anything to find. Pushing the name first is
the only check that works across machines and sessions.

Before starting anything: `git fetch --prune && git branch -a | grep <topic>`.

## Merging

| hop | method | why |
| --- | --- | --- |
| `feature` -> `staging/<version>` | **Squash** | one commit per shippable change keeps staging readable |
| `staging/<version>` -> `main` | **Rebase / fast-forward** | keeps the two identical |

Merge commits are disabled at the repo level, so the wrong button is not there.

**Never promote with a merge commit — and not with a squash either.** Both put
a commit on `main` that staging does not have, so staging reads as 1 behind
immediately and permanently, and every later catch-up has to reason about it.
This happened three times in one day and was undone by hand each time. Only a
rebase or fast-forward leaves the two branches identical.

Merge commits are disabled repo-wide, but **squash is not** — `feature ->
staging` needs it. So nothing mechanically prevents a squash-promotion. This
paragraph is the only guard; read it before clicking.

After any promotion, verify `staging` is `ahead:N behind:0`. If it is behind,
fast-forward it to `main` (`git merge --ff-only origin/main`) before starting
anything new.

Releases are marked with **annotated semver tags on `main`** — `git tag -a
v1.1.0 -m "..."`. Annotated, not lightweight, so the tag carries a date and a
message. This is what makes dropping the version branch safe: the release point
stays permanently addressable.

## Commits

On a feature branch, **commit early and often, including half-finished work**.
Squash-on-merge means none of it reaches `staging`, so there is no cost — and
uncommitted work is the one state nobody else can see or recover. A
component-based landing page once sat uncommitted in a worktree where any
`worktree remove` would have destroyed it silently.

The message that matters is the squash message, since it is what lands. Match
the existing history: imperative subject, body explaining **why**, not what.

## Worktrees

Use one **only when two branches must be checked out at once** — parallel
agents, or a long-running task while something else needs fixing. Sequential
work does not need a worktree; switch branches.

- Name the directory `<repo>-<branch-leaf>`.
- **Commit before leaving one**, even mid-thought.
- When the task ends: `git worktree remove <path>` then `git worktree prune`.
- Never abandon a worktree with a branch checked out — that branch then cannot
  be deleted or checked out anywhere else.

The worktree is disposable. The branch is the artifact. Three abandoned
worktrees once held about a gigabyte between them, one of them containing the
only copy of unpushed work.

## Cleanup

Both repos have **auto-delete-head-branch enabled** — a merged branch's remote
copy disappears on merge. Do not delete remotes by hand.

Locally, periodically:

```sh
git fetch --prune
git branch --merged staging/v1 | grep -vE '^\*|^\s*(staging/v1|main)$' | xargs -r git branch -d
```

Always `-d`, never `-D`, unless you have deliberately decided to discard
unmerged work — `-d` refuses when commits would be orphaned. If you do use
`-D`, record the SHA first; it stays recoverable for about 30 days.

Superseded work: delete the branch deliberately and put the SHA in the PR or
issue, rather than leaving it to rot. Thirty-three stale branches accumulated
before anyone swept, including six `worktree-agent-*` refs all pointing at the
same commit.

## Cross-repo changes

Features that span `adaptive-llm-agent` and `adaptive-llm-agent-admin` ship
together:

- Use **the same branch name in both repos**.
- Each PR body links the other.
- Do not promote `staging -> main` in one repo while the paired PR in the other
  is still open.

Three backend features once shipped to `main` while their frontend halves sat
on unmerged branches, so the API supported UI that did not exist.

## Protection and CI

`main` requires a pull request and a passing `test` check.

`staging/<version>` requires nothing — no PR, no checks — so integration stays
cheap. It does have **deletion and force-push blocked**, and that is not
decoration: `delete_branch_on_merge` is enabled, and on a release PR the *head*
branch is `staging/<version>`. Without the protection, merging a release would
delete the integration branch. It survived once only because an unrelated PR
happened to be open against it, and GitHub will not delete a branch that is the
base of an open PR.

Deploy checks (for example `Workers Builds` on the admin repo) are **not**
required — they are a deploy signal, not a correctness gate, and a provider
hiccup should not block correct code.

CI runs on every pull request and on pushes to `staging/<version>` and `main`.
