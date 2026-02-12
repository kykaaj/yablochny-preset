---
description: "Syncs the local user preset to the repository and pushes changes to GitHub."
---
# Push Updates to GitHub

This workflow automates the process of updating the Yablochny Preset extension. It performs two main actions:
1.  **Syncs** the active user preset (prompts, order, settings) from your local SillyTavern data folder to the repository file.
2.  **Commits and Pushes** all changes (including any code changes you or the AI made) to GitHub.

## Steps

1.  Run the synchronization script to copy your latest preset settings.
    ```bash
    node "c:/sillytavern/SillyTavern/public/scripts/extensions/third-party/yablochny-preset/tools/sync_from_user.cjs"
    ```

2.  Stage all changes (preset JSON, code, etc.).
    ```bash
    cd "c:/sillytavern/SillyTavern/public/scripts/extensions/third-party/yablochny-preset"
    git add .
    ```

3.  Commit the changes with a timestamped message.
    ```bash
    git commit -m "Update: Synced preset and code changes via /push workflow"
    ```

4.  Push to the `main` branch.
    // turbo
    ```bash
    git push origin main
    ```
