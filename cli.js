#!/usr/bin/env node
// Usage:
//   git log --format='%h%x09%an%x09%s' v1.2.0..HEAD | node cli.js - --version v1.3.0
//   node cli.js examples/git-log.txt --version v1.3.0 --repo https://github.com/acme/shop [--all]
const fs = require("fs");
const { draft } = require("./src/notes");

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const valued = new Set(["--version", "--repo", "--date"]);
const file = argv.find((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));

if (!file) {
  console.error("Usage: node cli.js <git-log.txt | -> [--version v1.3.0] [--date 2026-10-15] [--repo URL] [--all]");
  process.exit(2);
}

const text = fs.readFileSync(file === "-" ? 0 : file, "utf8");
console.log(
  draft(text.split(/\r?\n/), {
    version: opt("--version"),
    date: opt("--date") || new Date().toISOString().slice(0, 10),
    repoUrl: (opt("--repo") || "").replace(/\/$/, ""),
    all: argv.includes("--all"),
  })
);
