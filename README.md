# release-notes-draft

Turn `git log` into a grouped first draft of release notes — breaking changes first, PRs linked, contributors thanked — so a maintainer edits instead of writing from scratch.

## The problem

Release day: someone scrolls through 60 commits, decides which ones users care about, hunts for PR numbers, and tries not to forget the breaking change buried in the middle. It takes an hour, gets skipped when people are busy, and users find out about breaking changes the hard way.

## Who it's for

Developers and tech leads who ship versioned software — libraries, apps, internal services — and maintainers of open-source projects who owe contributors credit in every release.

## What it does

- Reads `git log --format='%h%x09%an%x09%s'` output from a file or stdin.
- Groups Conventional Commits (`feat`, `fix`, `perf`, `!` / `BREAKING CHANGE`) into **Breaking changes**, **Features**, **Fixes** and **Performance**, with scopes in bold.
- Links PR numbers like `(#41)` when you pass `--repo`; otherwise shows the commit hash.
- Skips merge commits and the release commit itself; counts docs, chores and non-conventional commits and hides them unless you pass `--all`.
- Thanks contributors by name — never `@handle`, so a draft doesn't ping anyone before it's published.

## Try it

Requires Node 18+. No install step, no dependencies.

```bash
node cli.js examples/git-log.txt --version v1.3.0 --repo https://github.com/acme/shop
node cli.js examples/git-log.txt --version v1.3.0 --all
git log --format='%h%x09%an%x09%s' v1.2.0..HEAD | node cli.js - --version v1.3.0
node --test
```

## Acceptance criteria

- Breaking changes (`!` or `BREAKING CHANGE`) appear first, even when their type is `feat` or `fix`.
- Merge commits and `chore(release)` commits are excluded.
- PR numbers become links when `--repo` is given; otherwise the commit hash is shown.
- Non-feature commits are hidden by default with a count, and listed with `--all`.
- The output contains no `@` mentions.

## How it's built

`src/notes.js` has `parseLine` (one commit line → structured object), `sectionOf`, and `draft` (groups and renders Markdown). Tab-separated input avoids ambiguity with commit subjects that contain spaces or colons. `cli.js` only handles arguments and stdin.

## Limits and safety

- It only reads commit subjects, not bodies, so a `BREAKING CHANGE:` footer in the body is missed — mark breaking commits with `!` in the subject.
- It is a draft. A maintainer should reword entries for users and check nothing is missing before publishing.
- Commit author names come from git config and are printed as-is; if your team prefers not to be named, remove the "Thanks to" line.

## Contribute

- Read commit bodies (`%b`) to catch `BREAKING CHANGE:` footers.
- Add a `--format github` option that outputs the exact text for a GitHub Release.
- Group `fix` commits by scope when there are many.

---

Scaffolded by an automated weekly pipeline, then refined by hand — see the factory repo for how it works.
