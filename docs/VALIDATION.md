# Actual validation — 23 October 2026

## Executed locally

| Check | Observed result |
| --- | --- |
| TypeScript `tsc --noEmit` | Passed (exit code 0) |
| Desktop Google Chrome | All 21 tests reported `passed` / `ok` |
| Desktop WebKit | All 21 tests reported `passed` |
| Pixel 7 / Chrome emulation | All 21 tests reported `passed` |
| iPhone 13 / WebKit emulation | All 21 tests reported `passed` |
| Firefox | Blocked before first page creation; not verified |
| Chrome DEMO rerun | Reported passing; browser recording saved |
| Code walkthrough video | Created; decoded with FFmpeg; 72.36 seconds; a source-code frame visually checked |
| GitHub Actions | Workflow supplied, not executed remotely |
| GitHub publication | Pending repository destination and authenticated push |

**84 test instances reported passing across four projects. This is not a claim of a clean full-matrix run or a successful runner exit.** On this sandboxed Windows host, the processes remained active during final cleanup after emitting test results and were interrupted manually. The report from the final Chrome demo run is available locally; CI on a clean supported runner remains required for acceptance.

The local host runs Node 20.16.0; the project and CI target Node 22+. The checks were run with `NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main` to work around Windows sandbox path resolution failures. The standard npm commands are intended for a normal developer machine or the supplied CI runner.

Firefox with pinned Playwright 1.58.2 and its installed Firefox revision 1509 launched but failed at `browserContext.newPage` with `Cannot read properties of undefined (reading '_page')`. A minimal standalone probe reproduced this without loading the demo app, with or without video capture. An independent probe against an already installed Playwright 1.64.1 / Firefox revision 1555 crashed at page creation too. Firefox remains enabled in the CI matrix; it has not been silently skipped or marked passing.

## Deliverable recordings

- `recordings/functionality-chrome.webm`: successful desktop Chrome registration → sign-out → returning-user sign-in → sign-out.
- `recordings/functionality-mobile-chrome.webm`: same successful journey in the mobile Chrome project.
- `recordings/code-walkthrough.webm`: captioned architecture and code explanation with real source excerpts, no audio.

Generated videos are excluded from Git to avoid repository bloat. They are included in the delivery archive and should accompany the submission separately. Browser videos show functionality; the code walkthrough presents source and explanatory captions rather than a spoken editor session.
