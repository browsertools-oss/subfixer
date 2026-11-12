const fs = require('fs');
const path = require('path');
const out = [];
function add(p) {
  let t = fs.readFileSync(p, 'utf8');
  t = t.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/&[a-z]+;/g, ' ').replace(/&#\d+;/g, ' ');
  const n = t.split(/\s+/).filter(Boolean).length;
  console.log(String(n).padStart(5), p);
}
for (const entry of fs.readdirSync('dist', { withFileTypes: true })) {
  const p = path.join('dist', entry.name);
  if (entry.isDirectory()) {
    const ip = path.join(p, 'index.html');
    if (fs.existsSync(ip)) add(ip);
  }
}
add('dist/index.html');
add('dist/404.html');
