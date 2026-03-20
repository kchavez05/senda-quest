---
description: Author release notes when merging to main
---

# Release Notes Workflow

This workflow is strictly required whenever changes are pushed from the `develop` branch to the `main` branch. It ensures consistency and accountability in tracking application updates.

## Procedures

1. **Trigger Condition**:
   - The user requests a production build, a release, or merging `develop` into `main`.

2. **Generate Release Notes**:
   - Review the commit history on `develop` since the last tag or main branch divergence.
   - Summarize the new features, bug fixes, and documentation updates.

3. **Store in Repository**:
   - Append the release notes to a designated `CHANGELOG.md` in the root of the repository, formatting it with the current date, version bump, and the summarized items.
   - If a `CHANGELOG.md` file does not exist, create one.

4. **Proceed to Merge**:
   - Only after generating the release notes should the final merge or PR to `main` be executed.
