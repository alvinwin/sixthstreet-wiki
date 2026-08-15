# Sixth Street

Sixth Street is the entry point for two compact Zenless Zone Zero endgame briefs:

- [Deadly Assault](https://alvinwin.github.io/zzz-deadly-assault/)
- [Shiyu Defense](https://alvinwin.github.io/zzz-shiyu-defense/)

This repository owns navigation only. Each mode keeps its own data, update process, and source checks.

## Local checks

```sh
npm install
npx playwright install chromium
npm run check
```

The build warns above 16 KiB raw and fails above 24 KiB raw or 10 KiB compressed.
