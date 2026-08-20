# Sixth Street

This repository is the navigation-first `sixthstreet.wiki` homepage for
compact Zenless Zone Zero notes. Its current live destinations are:

- [Deadly Assault](https://alvinwin.github.io/zzz-deadly-assault/)
- [Shiyu Defense](https://alvinwin.github.io/zzz-shiyu-defense/)

Future shelves are kept visible and marked `Coming next`. The Systems shelf
links to a generated, source-backed Attribute Anomaly reference and its related
term pages. Briefs use source labels to explain what was checked, when it was
checked, and which cycle or game version the note covers.

The site is static HTML and CSS with no framework. `scripts/build.mjs` copies
the homepage, term routes, shared styles, and assets into `dist/`. Local
commands already defined in `package.json` include `npm run build`,
`npm run check:budget`, `npm run serve`, `npm run test:e2e`, and
`npm run check`.
