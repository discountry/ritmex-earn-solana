# Repository Guidelines

## Project Structure & Module Organization
The mobile app lives in `src/`. Route screens use Expo Router file-based routing under `src/app/` (for example, `src/app/index.tsx` and `src/app/_layout.tsx`). Shared styling starts in `src/global.css`, and native Android output lives in `android/`. Reference material is kept in `docs/`: `docs/meteora/` contains protocol notes, while `docs/legacy-web-app/` is an older web codebase and should not be treated as the primary app.

## Build, Test, and Development Commands
Use npm scripts from the repository root:

- `npm run dev`: start Expo in dev-client mode with cache cleared.
- `npm run android`: build and launch the Android app locally.
- `npm run ios`: build and launch the iOS app locally.
- `npm run web`: run the Expo web target for quick UI checks.
- `npm run lint` / `npm run lint:check`: run Expo ESLint with or without fixes.
- `npm run fmt` / `npm run fmt:check`: format or verify formatting with Prettier.
- `npm run build`: type-check and run Android prebuild.
- `npm run ci`: the current baseline verification command before opening a PR.

## Coding Style & Naming Conventions
This project uses TypeScript, Expo Router, ESLint (`eslint-config-expo`), and Prettier. Follow the existing Prettier rules: 2-space indentation, single quotes, no semicolons, trailing commas, and `printWidth` 120. Name route files by path intent (`index.tsx`, `_layout.tsx`); use PascalCase for React components and camelCase for variables, hooks, and helper functions.

## Testing Guidelines
There is no automated test framework configured yet, and there is no coverage threshold. Until one is added, validate changes with `npm run ci` plus a smoke test on emulator/device. If you introduce testable business logic, prefer colocated `*.test.ts` or `*.test.tsx` files near the module they cover.

## Commit & Pull Request Guidelines
Git history currently starts with a single `Initial commit`, so keep commits short, imperative, and specific, for example: `Add earn dashboard shell` or `Fix wallet reconnect flow`. Pull requests should include a clear summary, local verification steps, linked issues when available, and screenshots or screen recordings for UI changes. Call out any `android/` regeneration or protocol/API changes explicitly.

## Security & Configuration Tips
Do not commit secrets or inspect `.env` files. Keep wallet, RPC, and protocol configuration out of source control unless the value is intentionally public. Prefer documenting integration details in `docs/meteora/` rather than embedding operational notes in code comments.
