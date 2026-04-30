# Local agent-browser CLI

This is a lightweight workspace-local browser automation helper for STAGE-FE.
It uses `playwright-core` with an installed Chrome/Edge executable, so it does
not download a browser bundle.

Examples:

```powershell
.\agent-browser.cmd open http://127.0.0.1:5173
.\agent-browser.cmd wait --load networkidle
.\agent-browser.cmd snapshot -i
.\agent-browser.cmd click e1
.\agent-browser.cmd eval "document.body.innerText.length"
.\agent-browser.cmd screenshot --annotate
.\agent-browser.cmd close
```

PowerShell treats unquoted `@e1` style arguments as splats, so use `e1` or quote
the ref as `'@e1'`.

Set `AGENT_BROWSER_EXECUTABLE` if Chrome or Edge is installed in a non-standard
location.
