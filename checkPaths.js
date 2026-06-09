const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname);

function getFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(filePath, ext));
    } else if (filePath.endsWith(ext)) {
      results.push(filePath);
    }
  });
  return results;
}

function extractPaths(content) {
  const regex = /(?:src|href)\s*=\s*"([^\"]+)"/g;
  const paths = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    const p = m[1];
    // Skip template literals or interpolations that contain '${'
    if (p.includes("${")) continue;
    paths.push(p);
  }
  // location.href assignments
  const hrefRegex = /location\.href\s*=\s*['"]([^'\"]+)['"]/g;
  while ((m = hrefRegex.exec(content)) !== null) {
    const p = m[1];
    if (p.includes("${")) continue;
    paths.push(p);
  }
  // window.location assignments
  const winRegex = /window\.location\s*=\s*['"]([^'\"]+)['"]/g;
  while ((m = winRegex.exec(content)) !== null) {
    const p = m[1];
    if (p.includes("${")) continue;
    paths.push(p);
  }
  return paths;
}

function resolvePath(baseFile, p) {
  if (
    p.startsWith("http://") ||
    p.startsWith("https://") ||
    p.startsWith("mailto:") ||
    p.startsWith("#")
  ) {
    return null;
  }
  if (p.startsWith("/")) {
    // treat as root-relative
    return path.join(root, p.slice(1));
  }
  // relative to the file's directory
  return path.resolve(path.dirname(baseFile), p);
}

let missing = [];
[".html", ".js"].forEach((ext) => {
  const files = getFiles(root, ext);
  files.forEach((f) => {
    const content = fs.readFileSync(f, "utf8");
    const paths = extractPaths(content);
    paths.forEach((p) => {
      const resolved = resolvePath(f, p);
      if (resolved && !fs.existsSync(resolved)) {
        missing.push({ file: f, path: p, resolved });
      }
    });
  });
});

if (missing.length === 0) {
  console.log("All referenced paths exist.");
} else {
  console.log("Missing paths:");
  missing.forEach((m) =>
    console.log(`${m.file} -> ${m.path} (resolved: ${m.resolved})`),
  );
}
