import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const files = [];
const issues = [];
const modalRestrictedFiles = new Set([
  path.normalize("src/pages/StudentProfilePage.jsx"),
  path.normalize("src/pages/CompanyInternshipsPage.jsx")
]);

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (stats.isFile() && (fullPath.endsWith(".js") || fullPath.endsWith(".jsx"))) {
      files.push(fullPath);
    }
  }
};

walk(srcRoot);

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const relativePath = path.normalize(path.relative(projectRoot, file));

  if (/\bconsole\.log\s*\(/.test(source)) {
    issues.push(`Disallowed console.log in ${relativePath}`);
  }

  if (/\b(?:TODO|FIXME)\b/.test(source)) {
    issues.push(`Unresolved TODO/FIXME marker in ${relativePath}`);
  }

  if (
    modalRestrictedFiles.has(relativePath) &&
    /(alert\s*\(|window\.prompt\s*\(|window\.confirm\s*\()/.test(source)
  ) {
    issues.push(`Browser modal API is not allowed in ${relativePath}`);
  }
}

if (issues.length > 0) {
  console.error("Frontend lint failed.\n");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Frontend lint passed on ${files.length} files.`);
