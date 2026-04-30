import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const roots = ["src", "tests", "scripts"];
const files = [];
const issues = [];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (stats.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }
};

for (const root of roots) {
  walk(path.join(projectRoot, root));
}

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const relativePath = path.relative(projectRoot, file);
  const syntaxCheck = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });

  if (syntaxCheck.status !== 0) {
    const details = syntaxCheck.stderr?.trim() || syntaxCheck.error?.message || "Unknown syntax check error";
    issues.push(`Syntax check failed: ${relativePath}\n${details}`);
  }

  if (
    relativePath.startsWith(`src${path.sep}`) &&
    relativePath !== path.join("src", "utils", "logger.js") &&
    /\bconsole\.log\s*\(/.test(source)
  ) {
    issues.push(`Disallowed console.log in ${relativePath}`);
  }
}

if (issues.length > 0) {
  console.error("Backend lint failed.\n");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Backend lint passed on ${files.length} files.`);
