const test = require("node:test");
const assert = require("node:assert");
const { parseLine, draft } = require("../src/notes");

test("parses type, scope, breaking marker and PR number", () => {
  assert.deepStrictEqual(parseLine("a1\tAda\tfeat(cart)!: drop legacy coupons (#12)"), {
    hash: "a1",
    author: "Ada",
    type: "feat",
    scope: "cart",
    breaking: true,
    subject: "drop legacy coupons",
    pr: 12,
  });
  assert.strictEqual(parseLine("b2\tTom\tfixed a typo").type, null);
});

test("merge commits, release commits and blank lines are ignored", () => {
  assert.strictEqual(parseLine("c3\tTom\tMerge pull request #4 from tom/x"), null);
  assert.strictEqual(parseLine("d4\tAda\tchore(release): v1.2.0"), null);
  assert.strictEqual(parseLine(""), null);
});

test("draft groups commits, links PRs and hides other changes by default", () => {
  const md = draft(
    [
      "a1\tAda\tfeat(cart): coupons (#1)",
      "b2\tTom\tfix: declined card message (#2)",
      "c3\tLin\tdocs: readme",
      "d4\tPriya\tfeat!: new search (#3)",
    ],
    { version: "v1.3.0", date: "2026-10-15", repoUrl: "https://github.com/acme/shop" }
  );
  assert.match(md, /^## v1\.3\.0 — 2026-10-15/);
  assert.match(md, /### ⚠️ Breaking changes\n\n- new search \(\[#3\]\(https:\/\/github\.com\/acme\/shop\/pull\/3\)\)/);
  assert.match(md, /### Features\n\n- \*\*cart:\*\* coupons/);
  assert.match(md, /### Fixes\n\n- declined card message/);
  assert.ok(!md.includes("### Other changes"));
  assert.match(md, /1 other commit\(s\).*hidden/);
});

test("--all shows other changes; contributors are thanked by name without @", () => {
  const md = draft(["a1\tAda\tdocs: readme", "b2\tTom\trefactor: tidy"], { all: true });
  assert.match(md, /### Other changes\n\n- readme \(a1\)\n- tidy \(b2\)/);
  assert.match(md, /Thanks to Ada, Tom\./);
  assert.ok(!md.includes("@"));
});

test("an empty range says so", () => {
  assert.match(draft([""]), /No changes found/);
});
