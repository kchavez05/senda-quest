# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-04-27

### Added
- **Mobile Native Porting**: Integrated Capacitor to enable native Android packaging and deployment. Added a `capacitor.config.ts` and successfully built the first Android platform initialization folder.
- **PWA Enhancements**: Initialized `vite-plugin-pwa` within `vite.config.ts` to implement offline-ready capabilities.
- **System Resiliency**: Added exponential backoff retry wrappers on the client API fetch (`useGameEngine.ts`) and the backend Google Gemini client (`server.ts`) to gracefully handle mobile network instability and API rate limits.

### Changed
- **State Management Refactor**: Completely stripped out the monolithic `GameStateContext` causing global application re-renders. Re-architected data streams using modular **Zustand** stores (`useGameStore.ts`) enabling granular React component rendering for vastly improved mobile performance.
- **Mobile UI**: Configured CSS `safe-area-inset` styling to prevent UI overlap with mobile notches and system bars.
- **Testing Updates**: Upgraded Vitest environment configuration to `jsdom` and re-wrote integration tests to pass locally against the new state architecture.

## [1.1.0] - 2026-03-20

### Added
- **Themed Adventures**: Players can now choose an overarching theme (Cyberpunk, Sci-Fi, Dark Fantasy, Cosmic Horror) during character creation, which dynamically alters the AI Game Master's atmospheric narrative and descriptive outputs.
- **Multiple Save Games**: Characters and their associated conversation logs are now persisted into distinct nested `/games/` Firestore collections, eliminating the "one character per user" restriction and allowing players to maintain multiple simultaneous storylines across distinct themes. The Landing Page was completely upgraded to seamlessly support launching new journeys or resuming saved ones.
- **CI/CD Pipeline Integration**: Added GitHub Actions yaml (`ci.yml`) to enforce code quality automatically on pull requests and pushes into `main` and `develop`.
- **Automated Testing Suite**: Initialized `Vitest` (for component and logic unit tests) and `Playwright` (for robust end-to-end browser integrations). Added parallel script executions to `.github/workflows/ci.yml`.
- **Agent Workflows**: Built explicit AI behavioral rules inside `.agents/workflows` forcing AI systems (or humans) to rigidly adhere to architectural maintenance:
  - `update_docs.md`: Mandates automated modifications to the README after pushing functional updates.
  - `release_notes.md`: Requires authoring of chronological markdown summaries right here in the Changelog during official merges out of `develop`.

### Changed
- Refactored `GameStateContext.tsx` to handle authentication streams alongside asynchronous nested array fetches for game environments.
- Updated `/api/gm-response` backend prompt configuration to safely inject and respect newly chosen player themes.
- Updated `firestore.rules` to correctly permit nested collection reads/writes inside `users/{uid}/games/{gameId}`.
