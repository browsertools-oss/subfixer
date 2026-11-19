#!/usr/bin/env node
// Quality gate, part 1: every internal link and asset in the built site must exist.
// Usage: node scripts/check-links.mjs [dist]   (exit 1 lists the broken ones)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || "dist");
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p) : files.push(p);
  }
})(root);

const exists = (url) => {
  let p = decodeURIComponent(url.split(/[?#]/)[0]);
  if (!p || p === "/") return fs.existsSync(path.join(root, "index.html"));
  const f = path.join(root, p);
  return [f, path.join(f, "index.html"), f + ".html"].some((x) => fs.existsSync(x) && (fs.statSync(x).isFile()));
};

const broken = new Map();
for (const file of files.filter((f) => f.endsWith(".html"))) {
  // Drop scripts, code samples and comments, so example markup in guides isn't read as links.
  const html = fs.readFileSync(file, "utf8").replace(/<(script|pre|code|template)\b[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const here = "/" + path.relative(root, path.dirname(file)).split(path.sep).join("/");
  for (const m of html.matchAll(/<[a-z][^>]*?\s(?:href|src)="([^"]+)"/gi)) {
    let u = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/|\{)/.test(u)) continue;
    if (!u.startsWith("/")) u = path.posix.join(here, u);
    if (!exists(u)) {
      const page = "/" + path.relative(root, file).split(path.sep).join("/");
      if (!broken.has(u)) broken.set(u, new Set());
      broken.get(u).add(page);
    }
  }
}
if (broken.size) {
  console.log(`${broken.size} broken internal link(s):`);
  for (const [u, pages] of broken) console.log(`- ${u}  (on ${[...pages].slice(0, 3).join(", ")}${pages.size > 3 ? ` and ${pages.size - 3} more` : ""})`);
  process.exit(1);
}
console.log(`links ok: ${files.filter((f) => f.endsWith(".html")).length} pages checked`);
