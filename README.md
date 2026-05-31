# TO BE CONTINUED

## CI Version Bump

This repository uses a CI-based version bump. On merges to `main`, a GitHub Action runs `scripts/ci-bump-version.mjs` which:

- Increments the patch version. If the patch is >= 9, it rolls over: increment minor and set patch to 0.
- Commits the updated `package.json`, tags the commit `vX.Y.Z`, and pushes the changes.

Local git hooks that previously modified `package.json` were removed to avoid merge conflicts. There is no `postinstall` hook that runs `scripts/setup-hooks.mjs` anymore.

To test locally without pushing, run:

```bash
node ./scripts/ci-bump-version.mjs
```

Note: running the script locally will attempt to commit and push if there are changes; run in a safe branch or inspect the file before committing.
