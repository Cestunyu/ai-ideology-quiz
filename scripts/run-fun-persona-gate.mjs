import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const gatePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, "demos", "fun-persona-quiz-gate.json");

const gate = JSON.parse(fs.readFileSync(gatePath, "utf8"));
const htmlPath = path.resolve(repoRoot, gate.source);
const html = fs.readFileSync(htmlPath, "utf8");

function extractConstLiteral(source, constName) {
  const marker = `const ${constName} = `;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Cannot find ${marker}`);
  }
  const start = source.indexOf("[", markerIndex);
  if (start === -1) {
    throw new Error(`Cannot find array literal for ${constName}`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const prev = source[index - 1];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "/" && source[index + 1] === "/") {
      const nextLine = source.indexOf("\n", index + 2);
      index = nextLine === -1 ? source.length : nextLine;
      continue;
    }

    if (char === "/" && source[index + 1] === "*") {
      const close = source.indexOf("*/", index + 2);
      index = close === -1 ? source.length : close + 1;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(start, index + 1);
        return vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 });
      }
    }

    if (prev === undefined && depth < 0) break;
  }

  throw new Error(`Cannot parse array literal for ${constName}`);
}

const questions = extractConstLiteral(html, "questions");
const profileSet = new Set(gate.profiles);
const failures = [];
const warnings = [];

function addFailure(message) {
  failures.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function compactLength(text) {
  return [...String(text).replace(/\s+/g, "")].length;
}

function formatScores(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([code, value]) => `${code}:${value}`)
    .join(" ");
}

function scoreChoice(choice, totals) {
  Object.entries(choice[2]).forEach(([code, value]) => {
    totals[code] = (totals[code] || 0) + value;
  });
}

function blankScores() {
  return Object.fromEntries(gate.profiles.map((code) => [code, 0]));
}

function rankedScores(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1] || gate.profiles.indexOf(a[0]) - gate.profiles.indexOf(b[0]));
}

function maxOtherWeight(weights, profile) {
  return Math.max(0, ...Object.entries(weights).filter(([code]) => code !== profile).map(([, value]) => value));
}

function chooseBestForProfile(question, profile) {
  return question.options
    .map((option, index) => {
      const weights = option[2];
      const own = weights[profile] || 0;
      const lead = own - maxOtherWeight(weights, profile);
      const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
      return { option, index, own, lead, total };
    })
    .sort((a, b) => b.own - a.own || b.lead - a.lead || a.total - b.total || a.index - b.index)[0];
}

function optionTopOwners(weights) {
  const maxWeight = Math.max(...Object.values(weights));
  return Object.entries(weights)
    .filter(([, value]) => value === maxWeight)
    .map(([code]) => code);
}

if (questions.length < gate.questionCount.min || questions.length > gate.questionCount.max) {
  addFailure(`Question count ${questions.length} is outside ${gate.questionCount.min}-${gate.questionCount.max}.`);
}

const seenIds = new Set();
const representative = Object.fromEntries(gate.profiles.map((code) => [code, {
  topOptions: 0,
  uniqueTopOptions: 0,
  strongOptions: 0,
  totalAvailable: 0
}]));

questions.forEach((question, questionIndex) => {
  if (seenIds.has(question.id)) addFailure(`Duplicate question id ${question.id}.`);
  seenIds.add(question.id);

  const promptLength = compactLength(question.text);
  if (promptLength > gate.lengthLimits.promptMaxChars) {
    addFailure(`${question.id} prompt is ${promptLength} chars, over ${gate.lengthLimits.promptMaxChars}: ${question.text}`);
  }

  gate.hardBannedPhrases.forEach((phrase) => {
    const foundInPrompt = question.text.includes(phrase);
    const foundInOption = question.options.some((option) => option[1].includes(phrase));
    if (foundInPrompt || foundInOption) {
      addFailure(`${question.id} contains banned phrase: ${phrase}`);
    }
  });

  gate.reviewTerms.forEach((term) => {
    if (question.text.includes(term) || question.options.some((option) => option[1].includes(term))) {
      addWarning(`${question.id} uses review term "${term}"; make sure it is concrete and funny enough.`);
    }
  });

  const labels = question.options.map((option) => option[0]).join("");
  if (labels !== gate.optionShape.requiredLabels.join("")) {
    addFailure(`${question.id} option labels are ${labels}, expected ${gate.optionShape.requiredLabels.join("")}.`);
  }

  if (question.options.length !== 4) {
    addFailure(`${question.id} has ${question.options.length} options, expected 4.`);
  }

  question.options.forEach((option) => {
    const [, label, weights] = option;
    const optionLength = compactLength(label);
    if (optionLength > gate.lengthLimits.optionMaxChars) {
      addFailure(`${question.id}${option[0]} option is ${optionLength} chars, over ${gate.lengthLimits.optionMaxChars}: ${label}`);
    }

    const weightEntries = Object.entries(weights);
    if (weightEntries.length > gate.optionShape.maxWeightedProfilesPerOption) {
      addFailure(`${question.id}${option[0]} maps to ${weightEntries.length} profiles, over ${gate.optionShape.maxWeightedProfilesPerOption}.`);
    }
    const weightTotal = weightEntries.reduce((sum, [, value]) => sum + value, 0);
    if (weightTotal > gate.optionShape.maxOptionWeightTotal) {
      addFailure(`${question.id}${option[0]} weight total ${weightTotal} is over ${gate.optionShape.maxOptionWeightTotal}.`);
    }

    weightEntries.forEach(([code, value]) => {
      if (!profileSet.has(code)) addFailure(`${question.id}${option[0]} uses unknown profile ${code}.`);
      if (!Number.isInteger(value) || value <= 0) addFailure(`${question.id}${option[0]} has invalid weight ${code}:${value}.`);
      if (profileSet.has(code)) representative[code].totalAvailable += value;
    });

    const owners = optionTopOwners(weights);
    owners.forEach((code) => {
      if (!profileSet.has(code)) return;
      representative[code].topOptions += 1;
      if (owners.length === 1) representative[code].uniqueTopOptions += 1;
      if ((weights[code] || 0) >= gate.representativeSignals.strongWeight) {
        representative[code].strongOptions += 1;
      }
    });
  });
});

gate.profiles.forEach((code) => {
  const signal = representative[code];
  if (signal.topOptions < gate.representativeSignals.minTopOptions) {
    addFailure(`${code} has only ${signal.topOptions} top-scoring representative options.`);
  }
  if (signal.uniqueTopOptions < gate.representativeSignals.minUniqueTopOptions) {
    addFailure(`${code} has only ${signal.uniqueTopOptions} uniquely-owned representative options.`);
  }
  if (signal.strongOptions < gate.representativeSignals.minStrongOptions) {
    addFailure(`${code} has only ${signal.strongOptions} strong representative options.`);
  }
});

const purePaths = Object.fromEntries(gate.profiles.map((profile) => {
  const scores = blankScores();
  const choices = [];
  questions.forEach((question) => {
    const best = chooseBestForProfile(question, profile);
    if (best.own === 0) {
      choices.push(`${question.id}-`);
      return;
    }
    scoreChoice(best.option, scores);
    choices.push(`${question.id}${best.option[0]}`);
  });
  const ranked = rankedScores(scores);
  const rank = ranked.findIndex(([code]) => code === profile) + 1;
  const runnerUp = ranked.find(([code]) => code !== profile);
  const margin = scores[profile] - (runnerUp ? runnerUp[1] : 0);
  return [profile, { scores, choices, rank, margin, ranked }];
}));

Object.entries(purePaths).forEach(([profile, pathInfo]) => {
  if (pathInfo.rank !== 1) {
    addFailure(`${profile} pure path ranks #${pathInfo.rank}: ${formatScores(pathInfo.scores)} via ${pathInfo.choices.join(" ")}`);
  }
  if (pathInfo.margin < gate.separability.purePathMinMargin) {
    addFailure(`${profile} pure path margin ${pathInfo.margin} is below ${gate.separability.purePathMinMargin}: ${formatScores(pathInfo.scores)}`);
  }
});

gate.separability.focusPairs.forEach(([target, confounder]) => {
  const pathInfo = purePaths[target];
  const margin = pathInfo.scores[target] - pathInfo.scores[confounder];
  if (margin < gate.separability.focusPairMinMargin) {
    addFailure(`${target} vs ${confounder} margin ${margin} is below ${gate.separability.focusPairMinMargin}: ${formatScores(pathInfo.scores)}`);
  }
});

gate.facetClusters.forEach((cluster) => {
  const matches = questions
    .filter((question) => cluster.terms.some((term) => question.text.includes(term) || question.facet.includes(term)))
    .map((question) => question.id);
  if (matches.length > cluster.maxQuestions) {
    addFailure(`${cluster.name} has ${matches.length} matching questions, over ${cluster.maxQuestions}: ${matches.join(", ")}`);
  }
});

function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const rng = makeRng(gate.randomSimulation.seed);
const topHits = Object.fromEntries(gate.profiles.map((code) => [code, 0]));

for (let sample = 0; sample < gate.randomSimulation.samples; sample += 1) {
  const scores = blankScores();
  questions.forEach((question) => {
    const choice = question.options[Math.floor(rng() * question.options.length)];
    scoreChoice(choice, scores);
  });
  const [top] = rankedScores(scores);
  topHits[top[0]] += 1;
}

Object.entries(topHits).forEach(([code, hits]) => {
  if (hits < gate.randomSimulation.minHitsPerProfile) {
    addFailure(`${code} appears only ${hits}/${gate.randomSimulation.samples} times in random simulation.`);
  }
  const share = hits / gate.randomSimulation.samples;
  if (share > gate.randomSimulation.maxTopShare) {
    addFailure(`${code} dominates random simulation at ${(share * 100).toFixed(1)}%.`);
  }
});

console.log(`Fun persona quiz gate: ${failures.length ? "FAIL" : "PASS"}`);
console.log(`Questions: ${questions.length}`);
console.log("");
console.log("Representative signal:");
gate.profiles.forEach((code) => {
  const signal = representative[code];
  console.log(`- ${code}: top=${signal.topOptions}, unique=${signal.uniqueTopOptions}, strong=${signal.strongOptions}, total=${signal.totalAvailable}`);
});
console.log("");
console.log("Pure paths:");
gate.profiles.forEach((code) => {
  const pathInfo = purePaths[code];
  console.log(`- ${code}: rank=${pathInfo.rank}, margin=${pathInfo.margin}, ${formatScores(pathInfo.scores)}`);
});
console.log("");
console.log("Random top hits:");
gate.profiles.forEach((code) => {
  const hits = topHits[code];
  console.log(`- ${code}: ${hits} (${((hits / gate.randomSimulation.samples) * 100).toFixed(1)}%)`);
});

if (warnings.length) {
  console.log("");
  console.log("Warnings:");
  warnings.forEach((message) => console.log(`- ${message}`));
}

if (failures.length) {
  console.log("");
  console.log("Failures:");
  failures.forEach((message) => console.log(`- ${message}`));
  process.exitCode = 1;
}
