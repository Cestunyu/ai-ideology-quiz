import fs from "node:fs";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";

const requiredFiles = [
  "admin/index.html",
  "api/health.js",
  "api/results.js",
  "api/storage-health.js",
  "api/export.csv.js",
  "api/submit-result.js",
  "fun/index.html",
  "fun/cn/index.html",
  "fun/en/index.html",
  "lib/result-storage.js",
  "scripts/build-vercel-dynamic-bundle.js",
  "scripts/deploy-vercel-dynamic.sh",
  "scripts/check-vercel-env-ready.js",
  "scripts/check-go-live-status.js",
  "scripts/watch-go-live-status.sh",
  "scripts/check-supabase-ready.js",
  "scripts/set-vercel-production-env.sh",
  "scripts/verify-vercel-live.js",
  "docs/vercel-supabase-go-live.md",
  "supabase/quiz-results-schema.sql",
  "vercel.json"
];

const requiredScriptEntries = [
  ["package.json", "\"release:bundle:vercel\": \"node scripts/build-vercel-dynamic-bundle.js\""],
  ["package.json", "\"vercel:check\": \"node scripts/check-vercel-dynamic-release.js\""],
  ["package.json", "\"vercel:deploy\": \"scripts/deploy-vercel-dynamic.sh\""],
  ["package.json", "\"vercel:env:check\": \"node scripts/check-vercel-env-ready.js production\""],
  ["package.json", "\"vercel:go-live:status\": \"node scripts/check-go-live-status.js\""],
  ["package.json", "\"vercel:go-live:watch\": \"scripts/watch-go-live-status.sh\""],
  ["package.json", "\"vercel:supabase:check\": \"node scripts/check-supabase-ready.js\""],
  ["package.json", "\"vercel:verify:live\": \"node scripts/verify-vercel-live.js\""],
  ["package.json", "\"fun:gate\": \"node scripts/run-fun-persona-gate.mjs demos/fun-persona-quiz-gate.json && node scripts/run-fun-persona-gate.mjs demos/fun-persona-quiz-gate-en.json\""],
  ["package.json", "\"release:check\": \"npm run quiz:check && npm run fun:gate && npm run vercel:check\""]
];

const requiredContent = [
  ["admin/index.html", "/api/results"],
  ["admin/index.html", "/api/storage-health"],
  ["admin/index.html", "/api/export.csv"],
  ["admin/index.html", "/api/health"],
  ["admin/index.html", "AI Persona Results"],
  ["fun/index.html", "/fun/en/"],
  ["fun/index.html", "/fun/cn/"],
  ["fun/cn/index.html", "AI 治理人格 · 轻松版"],
  ["fun/cn/index.html", "funPersonaWeights"],
  ["fun/cn/index.html", "scheduleAutoAdvance"],
  ["fun/cn/index.html", "分享图片生成后会显示在这里"],
  ["fun/cn/index.html", "保存图片"],
  ["fun/cn/index.html", "ai-persona-fun-"],
  ["fun/cn/index.html", "../../assets/profile-pictures/"],
  ["fun/cn/index.html", "return false"],
  ["fun/en/index.html", "AI Governance Persona · Fun Quiz"],
  ["fun/en/index.html", "funPersonaWeights"],
  ["fun/en/index.html", "scheduleAutoAdvance"],
  ["fun/en/index.html", "Your share image will appear here"],
  ["fun/en/index.html", "Save image"],
  ["fun/en/index.html", "ai-persona-fun-"],
  ["fun/en/index.html", "../../assets/profile-pictures/"],
  ["fun/en/index.html", "return false"],
  ["admin/index.html", "Storage"],
  ["docs/vercel-supabase-go-live.md", "scripts/set-vercel-production-env.sh production"],
  ["docs/vercel-supabase-go-live.md", "npm run vercel:verify:live -- --require-configured --submit"],
  ["docs/vercel-supabase-go-live.md", "REMOTE_DATABASE_TOKEN"],
  ["api/health.js", "dynamic"],
  ["scripts/verify-vercel-live.js", "verifyAuthenticatedDataAccess"],
  ["scripts/verify-vercel-live.js", "verifyCustomDomains"],
  ["scripts/verify-vercel-live.js", "/api/storage-health"],
  ["scripts/verify-vercel-live.js", "https://ai-persona.linenyu.com/en/"],
  ["scripts/verify-vercel-live.js", "REMOTE_DATABASE_TOKEN"],
  ["scripts/check-go-live-status.js", "Go-live status"],
  ["scripts/check-go-live-status.js", "Vercel env export token"],
  ["scripts/check-go-live-status.js", "--format"],
  ["scripts/check-go-live-status.js", "parseVercelEnvNames"],
  ["scripts/check-vercel-env-ready.js", "env names are ready"],
  ["scripts/check-vercel-env-ready.js", "lastIndexOf"],
  ["scripts/check-vercel-env-ready.js", "EXPORT_TOKEN or RESULTS_EXPORT_TOKEN"],
  ["scripts/deploy-vercel-dynamic.sh", "npm run vercel:env:check"],
  ["scripts/check-go-live-status.js", "checkVercelDomains"],
  ["scripts/check-go-live-status.js", "\"domains\""],
  ["scripts/check-go-live-status.js", "want Spaceship DNS"],
  ["scripts/check-go-live-status.js", "delete CNAME"],
  ["scripts/check-go-live-status.js", "DNS propagation"],
  ["scripts/check-go-live-status.js", "cloudflare"],
  ["scripts/watch-go-live-status.sh", "node scripts/check-go-live-status.js --strict"],
  ["scripts/watch-go-live-status.sh", "GO_LIVE_WATCH_INTERVAL"],
  ["scripts/watch-go-live-status.sh", "GO_LIVE_WATCH_MAX_ITERATIONS"],
  ["scripts/check-supabase-ready.js", "Supabase readiness check passed"],
  ["scripts/check-supabase-ready.js", "Temporary row deleted"],
  ["api/storage-health.js", "checkSupabaseRead"],
  ["api/results.js", "recordsToRows"],
  ["api/submit-result.js", "vercel-dynamic-unconfigured-storage"],
  ["lib/result-storage.js", "SUPABASE_URL"],
  ["lib/result-storage.js", "SUPABASE_SERVICE_ROLE_KEY"],
  ["supabase/quiz-results-schema.sql", "create table if not exists public.quiz_results"],
  ["vercel.json", "\"destination\": \"/en/\""]
];

const forbiddenContent = [
  ["fun/cn/index.html", "正式版"],
  ["fun/cn/index.html", "正式问卷"],
  ["fun/cn/index.html", "href=\"/cn/\""],
  ["fun/cn/index.html", "Demo"],
  ["fun/en/index.html", "formal version"],
  ["fun/en/index.html", "formal quiz"],
  ["fun/en/index.html", "href=\"/en/\""],
  ["fun/en/index.html", "Demo"]
];

const failures = [];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const file of requiredFiles) {
  assert(fs.existsSync(file), `${file} is required for the Vercel dynamic deployment.`);
}

for (const file of ["scripts/deploy-vercel-dynamic.sh", "scripts/set-vercel-production-env.sh", "scripts/watch-go-live-status.sh"]) {
  if (!fs.existsSync(file)) continue;
  assert((fs.statSync(file).mode & 0o111) !== 0, `${file} must be executable.`);
}

for (const [file, needle] of [...requiredScriptEntries, ...requiredContent]) {
  if (!fs.existsSync(file)) continue;
  assert(read(file).includes(needle), `${file} must include ${JSON.stringify(needle)}.`);
}

for (const [file, needle] of forbiddenContent) {
  if (!fs.existsSync(file)) continue;
  assert(!read(file).includes(needle), `${file} must not include ${JSON.stringify(needle)}.`);
}

function mockReq(method, url, body = "", headers = {}) {
  const stream = Readable.from(body ? [body] : []);
  stream.method = method;
  stream.url = url;
  stream.headers = {
    host: "localhost",
    "content-length": String(Buffer.byteLength(body)),
    ...headers
  };
  return stream;
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(body = "") {
      this.body = body;
    }
  };
}

function clearRuntimeEnv() {
  for (const key of [
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_RESULTS_TABLE",
    "EXPORT_TOKEN",
    "RESULTS_EXPORT_TOKEN"
  ]) {
    delete process.env[key];
  }
}

async function loadHandler(file) {
  const module = await import(pathToFileURL(fs.realpathSync(file)).href);
  return module.default;
}

async function runHandlerSmokeChecks() {
  const health = await loadHandler("api/health.js");
  const results = await loadHandler("api/results.js");
  const submit = await loadHandler("api/submit-result.js");
  const coreIds = ["U01", "H02", "C04", "C02", "C03", "L01", "I01", "T01", "D01", "R01", "R04", "E01", "H01", "H04"];
  const payload = {
    quiz_id: "ai-ideology-quiz",
    quiz_version: "release-check",
    measurement_version: "release-check",
    locale: "en",
    started_at: new Date(Date.now() - 1000).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: 1000,
    profile_code: "release-check",
    answers: Object.fromEntries(coreIds.map((id) => [id, { value: 3 }])),
    scenarios: { V3: { value: 3 } },
    scores: { x: 0, y: 0, c: 0, h: 0 },
    labels: {},
    projection: {},
    diagnostics: {},
    respondent_vector: {},
    profile_ranking: [],
    closest_statement: []
  };

  clearRuntimeEnv();

  let response = mockRes();
  health(mockReq("GET", "/api/health"), response);
  const healthBody = JSON.parse(response.body || "{}");
  assert(response.statusCode === 200, "api/health.js must return 200 for GET.");
  assert(healthBody.dynamic === true, "api/health.js must report dynamic: true.");
  assert(healthBody.storage?.configured === false, "api/health.js must report unconfigured storage without Supabase env vars.");

  response = mockRes();
  await submit(mockReq("POST", "/api/submit-result", JSON.stringify(payload)), response);
  const submitBody = JSON.parse(response.body || "{}");
  assert(response.statusCode === 200, "api/submit-result.js must accept valid payloads without Supabase env vars.");
  assert(submitBody.stored === false, "api/submit-result.js must report stored:false without Supabase env vars.");
  assert(
    submitBody.backend === "vercel-dynamic-unconfigured-storage",
    "api/submit-result.js must use the dynamic unconfigured-storage backend label."
  );

  response = mockRes();
  await results(mockReq("GET", "/api/results"), response);
  assert(response.statusCode === 500, "api/results.js must require EXPORT_TOKEN or RESULTS_EXPORT_TOKEN.");

  process.env.EXPORT_TOKEN = "release-check-token";
  response = mockRes();
  await results(mockReq("GET", "/api/results", "", { authorization: "Bearer release-check-token" }), response);
  const resultsBody = JSON.parse(response.body || "{}");
  assert(response.statusCode === 501, "api/results.js must report unconfigured storage without Supabase env vars.");
  assert(resultsBody.configured === false, "api/results.js must return configured:false without Supabase env vars.");
}

await runHandlerSmokeChecks().catch((error) => failures.push(error.stack || error.message));

if (failures.length) {
  console.error("Vercel dynamic release check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Vercel dynamic release check passed.");
