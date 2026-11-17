// Drafts release notes from `git log --format='%h%x09%an%x09%s'` output.
// Conventional Commit types are grouped into sections a user cares about;
// everything else is counted, and shown only with { all: true }.

const SECTIONS = [
  ["breaking", "⚠️ Breaking changes"],
  ["feat", "Features"],
  ["fix", "Fixes"],
  ["perf", "Performance"],
  ["other", "Other changes"],
];

const CONVENTIONAL = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;

function parseLine(line) {
  const [hash, author, ...rest] = line.split("\t");
  const raw = rest.join("\t").trim();
  if (!hash || !author || !raw) return null;
  if (/^Merge (pull request|branch|remote-tracking)/.test(raw)) return null;

  const pr = raw.match(/\(#(\d+)\)\s*$/);
  const text = pr ? raw.slice(0, pr.index).trim() : raw;
  const m = text.match(CONVENTIONAL);
  if (!m) return { hash, author: author.trim(), type: null, scope: null, breaking: false, subject: text, pr: pr ? Number(pr[1]) : null };

  const type = m[1].toLowerCase();
  if (type === "chore" && m[2] === "release") return null; // the release commit itself
  return {
    hash,
    author: author.trim(),
    type,
    scope: m[2] || null,
    breaking: Boolean(m[3]) || /BREAKING CHANGE/.test(m[4]),
    subject: m[4].trim(),
    pr: pr ? Number(pr[1]) : null,
  };
}

function sectionOf(c) {
  if (c.breaking) return "breaking";
  if (c.type === "feat" || c.type === "fix" || c.type === "perf") return c.type;
  return "other";
}

function draft(lines, { version = "Unreleased", date = "", repoUrl = "", all = false } = {}) {
  const commits = lines.map(parseLine).filter(Boolean);
  const groups = new Map(SECTIONS.map(([k]) => [k, []]));
  for (const c of commits) groups.get(sectionOf(c)).push(c);

  const ref = (c) => (c.pr ? (repoUrl ? ` ([#${c.pr}](${repoUrl}/pull/${c.pr}))` : ` (#${c.pr})`) : ` (${c.hash})`);
  const bullet = (c) => `- ${c.scope ? `**${c.scope}:** ` : ""}${c.subject}${ref(c)}`;

  const out = [`## ${version}${date ? ` — ${date}` : ""}`];
  for (const [key, title] of SECTIONS) {
    const list = groups.get(key);
    if (list.length === 0 || (key === "other" && !all)) continue;
    out.push("", `### ${title}`, "", ...list.map(bullet));
  }

  const hidden = all ? 0 : groups.get("other").length;
  if (hidden) out.push("", `_${hidden} other commit(s) (docs, chores, refactors, or not in Conventional Commits format) hidden — use --all to include them._`);

  // Names, not @handles: a draft shouldn't notify people before it's published.
  const people = [...new Set(commits.map((c) => c.author))].sort((a, b) => a.localeCompare(b));
  if (people.length) out.push("", `Thanks to ${people.join(", ")}.`);
  if (commits.length === 0) out.push("", "_No changes found in this range._");
  return out.join("\n");
}

module.exports = { parseLine, sectionOf, draft };
