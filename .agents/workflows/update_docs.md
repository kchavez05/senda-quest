---
description: Always update documentation after functional changes
---

# Documentation Update Workflow

This workflow dictates the procedure for updating appropriate documentation whenever significant code changes or new features are introduced to the codebase.

## Procedures

1. **Identify the Scope**:
   - Determine if the recent changes affect the user-facing functionality of the application, require new environment variables, or change installation instructions.

2. **Update README.md**:
   - Always modify the `README.md` at the root of the project to reflect the new state of the application. 
   - Ensure you highlight new features, add them to the feature list, and update screenshots or flow descriptions if applicable.

3. **Self-Correction**:
   - Do not prompt the user for permission to update the `README.md`. As an agent, proactively apply these documentation updates alongside the feature pull requests.
