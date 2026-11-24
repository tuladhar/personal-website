#!/usr/bin/env node
// Build the static snapshot of purutuladhar.com/python-for-sys-admin/ from tuladhar/Python-for-SysAdmin.
//
//   node scripts/python-for-sys-admin/build.mjs [--source URL_OR_DIR] [--date YYYY-MM-DD]
//
// Writes python-for-sys-admin/index.html, python-for-sys-admin/<slug>/index.html for every chapter,
// python-for-sys-admin/snapshot.json (state for the next run) and the guide's entries in sitemap.xml.
// Pages are rendered with the same pfs.js and pinned marked/highlight.js the browser uses.
// The output only changes when content changes, so an unchanged run leaves `git status` clean.
// Needs Node 18+ and network access (GitHub raw + cdnjs).

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "python-for-sys-admin");
const LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
];

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
  return acc;
}, []));
const TODAY = args.date || new Date().toISOString().slice(0, 10);
const SOURCE = String(args.source || "https://raw.githubusercontent.com/tuladhar/Python-for-SysAdmin/main/").replace(/\/?$/, "/");

async function get(rel) {
  if (/^https?:/.test(SOURCE)) {
    const r = await fetch(SOURCE + rel, { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) throw new Error(`GET ${SOURCE + rel}: HTTP ${r.status}`);
    return r.text();
  }
  return readFile(path.join(SOURCE, rel), "utf8");
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url}: HTTP ${r.status}`);
  return r.text();
}

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

// Chapters come from reviewed PRs, but strip active content anyway (the browser uses DOMPurify).
function sanitize(html) {
  return html
    .replace(/<(script|iframe|object|embed|style|form)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|iframe|object|embed|style|form|link|meta)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

async function main() {
  // 1. the same rendering code and libraries as the browser
  const ctx = vm.createContext({ URL, console });
  for (const url of LIBS) vm.runInContext(await fetchText(url), ctx, { filename: url });
  const pfsSrc = await readFile(path.join(OUT, "pfs.js"), "utf8");
  vm.runInContext(pfsSrc, ctx, { filename: "pfs.js" });
  const P = ctx.PFS;

  // 2. content
  const manifestText = await get("chapters/chapters.json");
  const manifest = JSON.parse(manifestText);
  const chapters = manifest.sections.flatMap((s) => s.chapters);
  const md = {};
  for (const ch of chapters) md[ch.slug] = await get("chapters/" + ch.file);

  // 3. previous state keeps lastmod dates stable when nothing changed
  let prev = { chapters: {} };
  try { prev = JSON.parse(await readFile(path.join(OUT, "snapshot.json"), "utf8")); } catch {}
  const template = await readFile(path.join(ROOT, "scripts/python-for-sys-admin/template.html"), "utf8");
  const assetVersion = sha([pfsSrc, await readFile(path.join(OUT, "app.js"), "utf8"), await readFile(path.join(OUT, "style.css"), "utf8")].join("\n"));

  const pages = chapters.map((c) => c.slug);
  const site = new P.Site(JSON.parse(manifestText), pages);
  const manifestHash = P.hash(manifestText);
  const state = { source: "tuladhar/Python-for-SysAdmin@main", manifestHash, chapters: {} };
  const summary = { added: [], changed: [], removed: [], unchanged: [] };

  function page({ title, ogTitle, description, url, ogType, jsonld, main, slug }) {
    const snapshot = { slug, pages, manifestHash, manifest: JSON.parse(manifestText) };
    const vars = {
      title: escAttr(title), og_title: escAttr(ogTitle), description: escAttr(description), url, og_type: ogType,
      jsonld: `  <script type="application/ld+json">${jsonForScript(jsonld)}</script>`,
      asset_version: assetVersion, main, snapshot: jsonForScript(snapshot),
    };
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
  }

  // 4. chapter pages
  for (const ch of site.flat) {
    const h = P.hash(md[ch.slug]);
    const old = prev.chapters?.[ch.slug];
    const lastmod = old && old.hash === h && old.file === ch.file && old.title === ch.title ? old.lastmod : TODAY;
    state.chapters[ch.slug] = { file: ch.file, title: ch.title, hash: h, lastmod };
    (old ? (lastmod === old.lastmod ? summary.unchanged : summary.changed) : summary.added).push(ch.slug);

    const body = P.renderChapter(site, md[ch.slug], sanitize);
    const main = P.chapter(site, ch, body).replace(`id="chapterBody" data-slug="${ch.slug}"`, `id="chapterBody" data-slug="${ch.slug}" data-md-hash="${h}"`);
    const url = P.SITE + P.BASE + ch.slug + "/";
    const description = `${ch.summary} Chapter ${P.pad(ch.n)} of Python for SysAdmin, a free community guide for sysadmins and DevOps engineers.`;
    const html = page({
      title: P.chapterTitle(ch), ogTitle: ch.title, description, url, ogType: "article", slug: ch.slug, main,
      jsonld: {
        "@context": "https://schema.org", "@type": "TechArticle", headline: ch.title, description: ch.summary, url,
        dateModified: lastmod, inLanguage: "en", author: { "@type": "Person", name: "Puru Tuladhar", url: "https://purutuladhar.com/" },
        isPartOf: { "@type": "WebSite", name: "Python for SysAdmin", url: P.SITE + P.BASE },
      },
    });
    await mkdir(path.join(OUT, ch.slug), { recursive: true });
    await writeFile(path.join(OUT, ch.slug, "index.html"), html);
  }

  // chapters that no longer exist lose their page
  for (const slug of Object.keys(prev.chapters || {})) {
    if (!state.chapters[slug]) {
      summary.removed.push(slug);
      await rm(path.join(OUT, slug), { recursive: true, force: true });
    }
  }

  // 5. home page
  state.homeLastmod = prev.manifestHash === manifestHash && prev.homeLastmod ? prev.homeLastmod : TODAY;
  await writeFile(path.join(OUT, "index.html"), page({
    title: P.HOME_TITLE, ogTitle: "Python for SysAdmin: a community guide", url: P.SITE + P.BASE, ogType: "website", slug: "",
    description: `A free, community-driven guide that teaches Python 3 to system administrators and DevOps engineers through real tasks. ${site.flat.length} chapters: files, logs, subprocess, argparse, JSON, CSV, SQLite and sockets. Practice hands-on in a free Linux VM.`,
    main: P.home(site),
    jsonld: {
      "@context": "https://schema.org", "@type": "WebSite", name: "Python for SysAdmin", url: P.SITE + P.BASE,
      description: "A free, community-driven guide to Python for system administrators and DevOps engineers.",
      author: { "@type": "Person", name: "Puru Tuladhar", url: "https://purutuladhar.com/" },
    },
  }));

  await writeFile(path.join(OUT, "snapshot.json"), JSON.stringify(state, null, 2) + "\n");

  // 6. sitemap: replace the guide's block, leave everything else alone
  const smPath = path.join(ROOT, "sitemap.xml");
  let sm = await readFile(smPath, "utf8");
  const urls = [[P.SITE + P.BASE, state.homeLastmod], ...site.flat.map((c) => [P.SITE + P.BASE + c.slug + "/", state.chapters[c.slug].lastmod])];
  const block = "  <!-- python-for-sys-admin: generated by scripts/python-for-sys-admin/build.mjs -->\n" +
    urls.map(([u, d]) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${d}</lastmod>\n  </url>\n`).join("") +
    "  <!-- /python-for-sys-admin -->\n";
  const marked = /  <!-- python-for-sys-admin:[\s\S]*?<!-- \/python-for-sys-admin -->\n/;
  const legacy = /  <url>\s*<loc>https:\/\/purutuladhar\.com\/python-for-sys-admin\/<\/loc>[\s\S]*?<\/url>\n/;
  if (marked.test(sm)) sm = sm.replace(marked, block);
  else if (legacy.test(sm)) sm = sm.replace(legacy, block);
  else sm = sm.replace("</urlset>", block + "</urlset>");
  await writeFile(smPath, sm);

  console.log(`Built ${site.flat.length} chapters + home into ${path.relative(process.cwd(), OUT) || "."}`);
  for (const k of ["added", "changed", "removed"]) if (summary[k].length) console.log(`  ${k}: ${summary[k].join(", ")}`);
  console.log("SUMMARY " + JSON.stringify(summary));
}

main().catch((e) => { console.error("build failed:", e.message); process.exit(1); });
