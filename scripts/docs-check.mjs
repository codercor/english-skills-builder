import fs from "node:fs";
import path from "node:path";
import {
  buildEnvIndex,
  buildModuleIndex,
  buildRouteIndex,
  buildTableIndex,
  readJson,
} from "./docs-index-data.mjs";

const ROOT = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function ensureFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing required file: ${relativePath}`);
  }
}

function compareJson(relativePath, expected) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing generated file: ${relativePath}`);
    return;
  }

  const actual = readJson(fullPath);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`Generated index is stale: ${relativePath}. Run npm run docs:generate-indexes`);
  }
}

function scanMarkdownLinks() {
  const markdownFiles = [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "llms.txt",
    "llms-full.txt",
    ...walkMarkdown(path.join(ROOT, "docs")),
  ].map((filePath) => path.join(ROOT, filePath));

  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const filePath of markdownFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const source = fs.readFileSync(filePath, "utf8");
    for (const match of source.matchAll(linkPattern)) {
      const rawTarget = match[1];
      if (
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("#") ||
        rawTarget.startsWith("mailto:")
      ) {
        continue;
      }

      const cleanTarget = rawTarget.split("#")[0];
      const resolved = path.resolve(path.dirname(filePath), cleanTarget);
      if (!fs.existsSync(resolved)) {
        fail(
          `Broken markdown link in ${path.relative(ROOT, filePath)} -> ${rawTarget}`,
        );
      }
    }
  }
}

function walkMarkdown(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(fullPath, results);
      continue;
    }

    if (entry.name.endsWith(".md") || entry.name.endsWith(".txt") || entry.name.endsWith(".json")) {
      results.push(path.relative(ROOT, fullPath));
    }
  }

  return results;
}

[
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "llms.txt",
  "llms-full.txt",
  "docs/architecture.md",
  "docs/domain-glossary.md",
  "docs/codebase-map.md",
  "docs/practice-contracts.md",
  "docs/data-model.md",
  "docs/auth-and-deploy.md",
  "docs/troubleshooting.md",
  "docs/examples/README.md",
  "docs/adr/ADR-001-topic-centric-learning-system.md",
  "docs/adr/ADR-002-single-practice-engine-across-builders.md",
  "docs/adr/ADR-003-grounded-feedback-over-speculative-fallback.md",
  "docs/adr/ADR-004-recognition-first-hybrid-interactions.md",
  "docs/adr/ADR-005-profile-centric-progress-and-map-surfaces.md",
  "docs/adr/ADR-006-vocabulary-item-level-evidence-model.md",
  "docs/generated/route-index.json",
  "docs/generated/module-index.json",
  "docs/generated/env-index.json",
  "docs/generated/table-index.json",
].forEach(ensureFile);

compareJson("docs/generated/route-index.json", buildRouteIndex());
compareJson("docs/generated/module-index.json", buildModuleIndex());
compareJson("docs/generated/env-index.json", buildEnvIndex());
compareJson("docs/generated/table-index.json", buildTableIndex());

scanMarkdownLinks();

if (errors.length) {
  for (const error of errors) {
    console.error(`docs:check: ${error}`);
  }
  process.exit(1);
}

console.log("docs:check passed.");
