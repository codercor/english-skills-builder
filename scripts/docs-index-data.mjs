import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walkFiles(dir, matcher = () => true, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkFiles(fullPath, matcher, results);
      continue;
    }

    if (matcher(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativePath(filePath) {
  return toPosix(path.relative(ROOT, filePath));
}

function routeFromPageFile(filePath) {
  const relative = relativePath(filePath)
    .replace(/^src\/app\//, "")
    .replace(/^page\.tsx$/, "")
    .replace(/^layout\.tsx$/, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/layout\.tsx$/, "");

  const segments = relative
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("("));

  if (!segments.length) {
    return "/";
  }

  return `/${segments.join("/")}`;
}

function routeFromApiFile(filePath) {
  const relative = relativePath(filePath)
    .replace(/^src\/app\/api\//, "")
    .replace(/\/route\.ts$/, "");

  return `/api/${relative}`;
}

export function buildRouteIndex() {
  const appFiles = walkFiles(path.join(ROOT, "src/app"), (filePath) =>
    filePath.endsWith("/page.tsx") || filePath.endsWith("/route.ts"),
  );

  return appFiles
    .map((filePath) => {
      const relative = relativePath(filePath);
      const route = relative.includes("/api/")
        ? routeFromApiFile(filePath)
        : routeFromPageFile(filePath);

      return {
        route,
        kind: relative.includes("/api/") ? "api" : "page",
        file: relative,
      };
    })
    .sort((left, right) => left.route.localeCompare(right.route));
}

export function buildEnvIndex() {
  const filesToScan = [
    ...walkFiles(path.join(ROOT, "src"), (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx")),
    path.join(ROOT, "drizzle.config.ts"),
    path.join(ROOT, "middleware.ts"),
  ].filter((filePath) => fs.existsSync(filePath));

  const envUsage = new Map();
  const envPattern = /process\.env\.([A-Z0-9_]+)/g;

  for (const filePath of filesToScan) {
    const source = fs.readFileSync(filePath, "utf8");
    for (const match of source.matchAll(envPattern)) {
      const name = match[1];
      const entry = envUsage.get(name) ?? { files: new Set() };
      entry.files.add(relativePath(filePath));
      envUsage.set(name, entry);
    }
  }

  const examplePath = path.join(ROOT, ".env.example");
  const envFromExample = fs.existsSync(examplePath)
    ? fs
        .readFileSync(examplePath, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => line.split("=")[0])
    : [];

  const descriptions = {
    AUTH_SECRET: "Auth.js secret used for session signing and middleware token parsing.",
    NEXTAUTH_URL: "Canonical application URL used by Auth.js callbacks.",
    DATABASE_URL: "Primary pooled Postgres connection string used at runtime and by Drizzle.",
    DATABASE_URL_UNPOOLED: "Direct Postgres connection string for tasks that should avoid pooling.",
    PGHOST: "Pooled Postgres host helper for platform integrations.",
    PGHOST_UNPOOLED: "Direct Postgres host helper for platform integrations.",
    AUTH_GOOGLE_ID: "Google OAuth client ID for Auth.js sign-in.",
    AUTH_GOOGLE_SECRET: "Google OAuth client secret for Auth.js sign-in.",
    AUTH_RESEND_KEY: "Resend API key for email delivery integrations.",
    AUTH_EMAIL_FROM: "Default sender address for auth-related email flows.",
    OPENAI_API_KEY: "OpenAI API key for LLM-based evaluation.",
    OPENAI_MODEL: "Default model name for LLM-based evaluation.",
  };

  const requiredInProduction = new Set([
    "AUTH_SECRET",
    "NEXTAUTH_URL",
    "DATABASE_URL",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
  ]);

  return [...new Set([...envFromExample, ...envUsage.keys()])]
    .sort()
    .map((name) => ({
      name,
      requiredInProduction: requiredInProduction.has(name),
      files: [...(envUsage.get(name)?.files ?? [])].sort(),
      description: descriptions[name] ?? "Documented environment variable.",
    }));
}

export function buildTableIndex() {
  const schemaPath = path.join(ROOT, "src/lib/db/schema.ts");
  const source = fs.readFileSync(schemaPath, "utf8");
  const pattern = /export const ([A-Za-z0-9_]+) = pgTable\("([a-z0-9_]+)"/g;
  const subsystemByTable = {
    users: "auth",
    accounts: "auth",
    sessions: "auth",
    verification_tokens: "auth",
    authenticators: "auth",
    profiles: "profile",
    onboarding_profiles: "onboarding",
    goals: "profile",
    skill_profiles: "profile",
    structure_catalog: "catalog",
    assessment_attempts: "assessment",
    practice_sessions: "practice",
    practice_items: "practice",
    user_responses: "practice",
    feedback_events: "practice",
    error_events: "practice",
    review_items: "review",
    mastery_records: "mastery",
    progression_decisions: "mastery",
    recommendation_events: "recommendation",
    league_weeks: "league",
    league_memberships: "league",
    league_scores: "league",
    structure_cups: "league",
    boss_sessions: "league",
    achievements: "league",
  };

  return [...source.matchAll(pattern)].map((match) => ({
    exportName: match[1],
    tableName: match[2],
    subsystem: subsystemByTable[match[2]] ?? "learning",
    file: "src/lib/db/schema.ts",
  }));
}

export function buildModuleIndex() {
  return [
    {
      module: "auth",
      file: "src/auth.ts",
      responsibility: "Auth.js provider setup, adapter wiring, and session callbacks.",
    },
    {
      module: "database-client",
      file: "src/lib/db/client.ts",
      responsibility: "Runtime Postgres client and Drizzle adapter creation.",
    },
    {
      module: "schema",
      file: "src/lib/db/schema.ts",
      responsibility: "Source of truth for auth and learning persistence tables.",
    },
    {
      module: "catalog",
      file: "src/lib/catalog.ts",
      responsibility: "Topic catalog and builder metadata used across surfaces.",
    },
    {
      module: "practice-bank",
      file: "src/lib/data/practice-bank.ts",
      responsibility: "Authored and safe-fallback practice blueprints.",
    },
    {
      module: "vocabulary-targets",
      file: "src/lib/data/vocabulary-targets.ts",
      responsibility: "Vocabulary item-level teaching content and progress anchors.",
    },
    {
      module: "learning-server",
      file: "src/lib/server/learning.ts",
      responsibility: "Session creation, review scheduling, profile/progress snapshots, and nav payloads.",
    },
    {
      module: "topic-views",
      file: "src/lib/server/topic-views.ts",
      responsibility: "Builder hub, catalog, topic detail, and learning map snapshots.",
    },
    {
      module: "evaluator",
      file: "src/lib/engine/evaluator.ts",
      responsibility: "Practice evaluation, feedback shaping, confidence handling, and fallback logic.",
    },
    {
      module: "scoring",
      file: "src/lib/engine/scoring.ts",
      responsibility: "Response, session, weekly, and speed bonus scoring.",
    },
    {
      module: "practice-ui",
      file: "src/components/practice-session-client.tsx",
      responsibility: "Practice runtime UI, hybrid task flow, timer, and drawer behavior.",
    },
    {
      module: "practice-drawer",
      file: "src/components/practice-drawer-nav.tsx",
      responsibility: "Practice-local navigation rail and mobile drawer.",
    },
    {
      module: "profile",
      file: "src/app/(workspace)/profile/page.tsx",
      responsibility: "Profile hub for overview, learning map, and progress insights.",
    },
  ];
}

export function writeJson(targetPath, value) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJson(targetPath) {
  return JSON.parse(fs.readFileSync(targetPath, "utf8"));
}
