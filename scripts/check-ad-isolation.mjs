import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Live ads are real inventory. They may appear only where lib/ads/policy.ts allows, through the
 * two components below, and never inside demos, the sandbox, the studio or lessons.
 *
 * 1. Only the listed files may import the live-ad components.
 * 2. Demo, sandbox, studio and legacy showroom/creator code must not even mention adsbygoogle.
 * 3. The ad script is loaded by exactly one component, which the root layout mounts exactly once.
 */

const ROOT = process.cwd();
const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");

/** component name -> files allowed to import it */
const ALLOWED_IMPORTERS = {
  RealAd: ["components/editorial/EditorialArticle.tsx", "components/ads/SponsoredSlot.tsx"],
  SponsoredSlot: ["app/page.tsx", "app/gallery/page.tsx"],
  AdSenseLoader: ["app/layout.tsx"],
};

/** Paths (files or directories) where the string "adsbygoogle" must never appear. */
const NO_AD_CODE = [
  "app/garage",
  "app/build",
  "app/sandbox",
  "app/create",
  "app/learn",
  "app/projects",
  "app/integrations",
  "app/plans",
  "app/pricing",
  "app/api",
  "app/gallery/[id]",
  "components/garage",
  "components/build",
  "components/studio",
  "components/sandbox",
  "components/learn",
  "components/projects",
  "components/integrations",
  "components/plans",
  "components/pricing",
  "components/gallery",
  "components/home",
  "lib/ads/ad-document.ts",
  "lib/studio",
  "lib/demo",
  "lib/services",
  "lib/domain",
];

const SOURCE = /\.(tsx|ts|jsx|js|mjs|css|md)$/;
const SCRIPT_URL = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const LOADER = "components/ads/AdSenseLoader.tsx";

async function walk(target) {
  let entries;
  try {
    entries = await readdir(target, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOTDIR") return [target];
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
  const nested = await Promise.all(entries.map((entry) => walk(path.join(target, entry.name))));
  return nested.flat();
}

async function sourceFiles(paths) {
  const lists = await Promise.all(paths.map((p) => walk(path.join(ROOT, p))));
  return lists.flat().filter((file) => SOURCE.test(file));
}

async function main() {
  const failures = [];

  // 1. Importers of the live-ad components.
  const everything = await sourceFiles(["app", "components", "lib"]);
  for (const file of everything) {
    const text = await readFile(file, "utf8");
    for (const [name, allowed] of Object.entries(ALLOWED_IMPORTERS)) {
      const imports = new RegExp(`from\\s+["'][^"']*\\/${name}["']`).test(text);
      if (imports && !allowed.includes(rel(file))) {
        failures.push(`${rel(file)} imports ${name}. Allowed: ${allowed.join(", ")}`);
      }
    }
  }

  // 2. No ad code in demo and creation surfaces.
  for (const file of await sourceFiles(NO_AD_CODE)) {
    const text = await readFile(file, "utf8");
    if (text.includes("adsbygoogle")) failures.push(`adsbygoogle found in ${rel(file)}`);
  }

  // 3. One script, one loader, mounted once. Only code the site itself runs counts: lib/export.ts
  //    writes the URL into snippets that users download, which is not this site loading it.
  const hits = [];
  for (const file of everything.filter((f) => !rel(f).startsWith("lib/"))) {
    const text = await readFile(file, "utf8");
    if (text.includes(SCRIPT_URL)) hits.push(rel(file));
  }
  if (hits.length !== 1 || hits[0] !== LOADER) {
    failures.push(`Expected the ad script URL only in ${LOADER}; found in: ${hits.join(", ") || "nowhere"}`);
  }
  const layout = await readFile(path.join(ROOT, "app", "layout.tsx"), "utf8");
  const mounts = layout.match(/<AdSenseLoader\s*\/>/g) ?? [];
  if (mounts.length !== 1) failures.push(`Expected <AdSenseLoader /> once in app/layout.tsx, found ${mounts.length}`);

  if (failures.length > 0) {
    for (const failure of failures) console.error(`FORBIDDEN: ${failure}`);
    process.exit(1);
  }
  console.log("Ad isolation check passed: live ads only through the policy-approved components and routes.");
}

main();
