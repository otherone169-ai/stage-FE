#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const stateDir = path.join(repoRoot, ".agent-browser");
const statePath = path.join(stateDir, "state.json");
const storageStatePath = path.join(stateDir, "storage.json");

const defaultState = {
  currentUrl: null,
  refs: {},
  consoleErrors: []
};

const command = process.argv[2];
const args = process.argv.slice(3);

const usage = () => {
  console.log(`agent-browser commands:
  open <url>
  wait <ms|selector|--load load|domcontentloaded|networkidle>
  snapshot [-i]
  screenshot [path] [--full] [--annotate]
  eval <javascript-expression>
  get url|title|text [selector-or-ref]
  click <selector-or-ref>
  fill <selector-or-ref> <text>
  type <selector-or-ref> <text>
  select <selector-or-ref> <value>
  press <key>
  scroll <up|down|amount> [amount]
  close

Refs printed as @e1 also work as e1 for PowerShell.`);
};

const ensureStateDir = () => {
  fs.mkdirSync(stateDir, { recursive: true });
};

const loadState = () => {
  ensureStateDir();
  if (!fs.existsSync(statePath)) return { ...defaultState };

  try {
    return { ...defaultState, ...JSON.parse(fs.readFileSync(statePath, "utf8")) };
  } catch {
    return { ...defaultState };
  }
};

const saveState = (state) => {
  ensureStateDir();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
};

const findBrowserExecutable = () => {
  const candidates = [
    process.env.AGENT_BROWSER_EXECUTABLE,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium"
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const createContext = async () => {
  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      "No Chrome/Edge executable found. Set AGENT_BROWSER_EXECUTABLE to a Chromium-compatible browser path."
    );
  }

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-gpu", "--no-first-run"]
  });

  const contextOptions = {
    viewport: { width: 1366, height: 768 }
  };
  if (fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
  }

  const context = await browser.newContext(contextOptions);

  await context.addInitScript(() => {
    window.__consoleErrors = [];
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...items) => {
      window.__consoleErrors.push({ type: "error", message: items.map(String).join(" ") });
      originalError(...items);
    };
    console.warn = (...items) => {
      window.__consoleErrors.push({ type: "warn", message: items.map(String).join(" ") });
      originalWarn(...items);
    };
  });

  const page = context.pages()[0] || (await context.newPage());
  page.on("pageerror", (error) => {
    const state = loadState();
    state.consoleErrors = [
      ...(state.consoleErrors || []),
      { type: "pageerror", message: error.message }
    ].slice(-50);
    saveState(state);
  });

  return { browser, context, page };
};

const resolveTarget = (target, state) => {
  if (!target) return target;
  const refName = target.startsWith("@") ? target : /^e\d+$/i.test(target) ? `@${target}` : null;
  if (refName) {
    const ref = state.refs[refName];
    if (!ref) {
      throw new Error(`Unknown ref ${target}. Run "agent-browser snapshot -i" first.`);
    }
    return ref.selector;
  }
  return target;
};

const gotoCurrent = async (page, state) => {
  if (!state.currentUrl) {
    throw new Error("No current page. Run \"agent-browser open <url>\" first.");
  }

  await page.goto(state.currentUrl, { waitUntil: "domcontentloaded" });
};

const syncUrl = async (page, state) => {
  const nextUrl = page.url();
  if (nextUrl && nextUrl !== "about:blank") {
    state.currentUrl = nextUrl;
  }
  try {
    const consoleErrors = await page.evaluate(() => window.__consoleErrors || []);
    state.consoleErrors = [...(state.consoleErrors || []), ...consoleErrors].slice(-50);
  } catch {
    // The page may be cross-origin or closed; preserving URL is enough.
  }
  saveState(state);
};

const printJson = (value) => {
  if (typeof value === "string") {
    console.log(value);
  } else {
    console.log(JSON.stringify(value, null, 2));
  }
};

const pathFromRoot = (outputPath) => path.resolve(process.cwd(), outputPath);

const withPage = async (callback) => {
  const state = loadState();
  const { browser, context, page } = await createContext();

  try {
    await callback({ context, page, state });
  } finally {
    try {
      await syncUrl(page, state);
    } finally {
      await context.storageState({ path: storageStatePath }).catch(() => {});
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }
};

const makeSnapshot = async (page) =>
  page.evaluate(() => {
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };

    const cssPath = (el) => {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let current = el;

      while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
        const tag = current.nodeName.toLowerCase();
        const parent = current.parentElement;
        if (!parent) break;

        const siblings = Array.from(parent.children).filter((child) => child.nodeName.toLowerCase() === tag);
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tag}:nth-of-type(${index})`);
        current = parent;
      }

      return `body > ${parts.join(" > ")}`;
    };

    const labelFor = (el) => {
      const byAria = el.getAttribute("aria-label");
      const byPlaceholder = el.getAttribute("placeholder");
      const byValue = el.tagName === "INPUT" ? el.value : "";
      const byText = el.innerText || el.textContent || "";
      return (byAria || byPlaceholder || byValue || byText || el.tagName.toLowerCase()).replace(/\s+/g, " ").trim();
    };

    const elements = Array.from(
      document.querySelectorAll(
        "a[href],button,input,textarea,select,[role='button'],[tabindex]:not([tabindex='-1'])"
      )
    )
      .filter(isVisible)
      .slice(0, 200)
      .map((el, index) => ({
        ref: `@e${index + 1}`,
        selector: cssPath(el),
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type") || el.getAttribute("role") || "",
        text: labelFor(el).slice(0, 120)
      }));

    return {
      url: window.location.href,
      title: document.title,
      text: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 5000),
      elements
    };
  });

const annotatePage = async (page, refs) => {
  await page.evaluate((items) => {
    document.querySelectorAll("[data-agent-browser-label]").forEach((node) => node.remove());

    for (const item of items) {
      const el = document.querySelector(item.selector);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const label = document.createElement("div");
      label.textContent = item.ref;
      label.dataset.agentBrowserLabel = "true";
      label.style.position = "fixed";
      label.style.left = `${Math.max(rect.left, 0)}px`;
      label.style.top = `${Math.max(rect.top, 0)}px`;
      label.style.zIndex = "2147483647";
      label.style.padding = "2px 5px";
      label.style.background = "#ffef5f";
      label.style.color = "#111";
      label.style.border = "1px solid #111";
      label.style.borderRadius = "3px";
      label.style.font = "12px sans-serif";
      document.body.appendChild(label);
    }
  }, Object.values(refs));
};

const run = async () => {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "close") {
    if (fs.existsSync(storageStatePath)) {
      fs.rmSync(storageStatePath, { force: true });
    }
    saveState({ ...defaultState });
    console.log("agent-browser state cleared");
    return;
  }

  if (command === "open") {
    const url = args[0];
    if (!url) throw new Error("Usage: agent-browser open <url>");

    await withPage(async ({ page, state }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      state.currentUrl = page.url();
      console.log(`opened ${state.currentUrl}`);
    });
    return;
  }

  if (command === "wait") {
    await withPage(async ({ page, state }) => {
      await gotoCurrent(page, state);
      if (args[0] === "--load") {
        const stateName = args[1] || "networkidle";
        await page.waitForLoadState(stateName, { timeout: 30000 });
        console.log(`waited for ${stateName}`);
      } else if (/^\d+$/.test(args[0] || "")) {
        await page.waitForTimeout(Number(args[0]));
        console.log(`waited ${args[0]}ms`);
      } else {
        const selector = resolveTarget(args[0], state);
        await page.waitForSelector(selector, { timeout: 30000 });
        console.log(`found ${args[0]}`);
      }
    });
    return;
  }

  if (command === "snapshot") {
    await withPage(async ({ page, state }) => {
      await gotoCurrent(page, state);
      const snapshot = await makeSnapshot(page);
      state.refs = Object.fromEntries(snapshot.elements.map((item) => [item.ref, item]));

      console.log(`URL: ${snapshot.url}`);
      console.log(`Title: ${snapshot.title || "(untitled)"}`);
      console.log("");
      console.log(snapshot.text || "(no visible text)");

      if (args.includes("-i")) {
        console.log("");
        console.log("Interactive elements:");
        for (const item of snapshot.elements) {
          console.log(`${item.ref} ${item.tag}${item.type ? `[${item.type}]` : ""} ${JSON.stringify(item.text)}`);
        }
      }
    });
    return;
  }

  if (command === "screenshot") {
    await withPage(async ({ page, state }) => {
      await gotoCurrent(page, state);
      if (args.includes("--annotate")) {
        const snapshot = await makeSnapshot(page);
        state.refs = Object.fromEntries(snapshot.elements.map((item) => [item.ref, item]));
        await annotatePage(page, state.refs);
      }

      const explicitPath = args.find((arg) => !arg.startsWith("--"));
      const outputPath = explicitPath
        ? pathFromRoot(explicitPath)
        : path.join(os.tmpdir(), `agent-browser-${Date.now()}.png`);
      await page.screenshot({ path: outputPath, fullPage: args.includes("--full") });
      console.log(outputPath);
    });
    return;
  }

  if (command === "eval") {
    const expression = args.join(" ");
    if (!expression) throw new Error("Usage: agent-browser eval <javascript-expression>");

    await withPage(async ({ page, state }) => {
      await gotoCurrent(page, state);
      const result = await page.evaluate((source) => {
        // eslint-disable-next-line no-eval
        return eval(source);
      }, expression);
      printJson(result);
    });
    return;
  }

  if (command === "get") {
    const what = args[0];
    await withPage(async ({ page, state }) => {
      await gotoCurrent(page, state);

      if (what === "url") {
        console.log(page.url());
      } else if (what === "title") {
        console.log(await page.title());
      } else if (what === "text") {
        const target = resolveTarget(args[1] || "body", state);
        console.log((await page.locator(target).first().innerText()).trim());
      } else {
        throw new Error("Usage: agent-browser get url|title|text [selector-or-ref]");
      }
    });
    return;
  }

  if (["click", "fill", "type", "select", "press", "scroll"].includes(command)) {
    await withPage(async ({ page, state }) => {
      await gotoCurrent(page, state);

      if (command === "press") {
        await page.keyboard.press(args[0]);
        console.log(`pressed ${args[0]}`);
        return;
      }

      if (command === "scroll") {
        const direction = args[0] || "down";
        const amount = Number(args[1] || (Number.isFinite(Number(direction)) ? direction : 500));
        const delta = direction === "up" ? -amount : amount;
        await page.mouse.wheel(0, delta);
        console.log(`scrolled ${delta}`);
        return;
      }

      const target = resolveTarget(args[0], state);
      if (!target) throw new Error(`Usage: agent-browser ${command} <selector-or-ref>`);
      const locator = page.locator(target).first();

      if (command === "click") {
        await locator.click();
        await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
        console.log(`clicked ${args[0]}`);
      } else if (command === "fill") {
        await locator.fill(args.slice(1).join(" "));
        console.log(`filled ${args[0]}`);
      } else if (command === "type") {
        await locator.pressSequentially(args.slice(1).join(" "));
        console.log(`typed ${args[0]}`);
      } else if (command === "select") {
        await locator.selectOption(args[1]);
        console.log(`selected ${args[1]} in ${args[0]}`);
      }
    });
    return;
  }

  throw new Error(`Unknown command: ${command}`);
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
