# Branch Protection Setup

This document provides step-by-step instructions to configure branch protection rules for the `main` branch to enforce quality gates before merging.

## Required GitHub Repository Settings

### 1. Configure Branch Protection Rules

Navigate to: **Settings → Branches → Add branch protection rule**

**Branch name pattern:** `main`

#### Required Settings

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1 (optional - remove if you're the only contributor)
  - ✅ Dismiss stale pull request approvals when new commits are pushed (optional)
  - ✅ Require review from Code Owners (optional)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:** Add the following:
    - `Build & Validate` (from CI workflow)

- ✅ **Require conversation resolution before merging** (optional but recommended)

- ✅ **Require linear history** (optional but recommended)
  - Prevents merge commits, enforces rebase or squash merging
  - Keeps git history clean and readable

- ✅ **Do not allow bypassing the above settings**
  - Enforces rules for administrators too (recommended)

- ✅ **Allow force pushes** → **Specify who can force push** → (leave empty)
  - Prevents history rewriting on main branch

- ✅ **Allow deletions** → ❌ (disabled)
  - Prevents accidental branch deletion

Click **Create** or **Save changes**.

### 2. Configure GitHub Pages Environment

Navigate to: **Settings → Environments**

If `github-pages` environment doesn't exist, it will be created automatically when the deploy workflow first runs.

**Optional: Add deployment protection rules**
- **Wait timer:** Set to 0 minutes (no wait for landing page)
- **Required reviewers:** None (auto-deploy on merge to main)
- **Allow administrators to bypass configured protection rules:** Your choice

**Why use an environment?**
- Tracks deployment history at yellowdex.ai
- Allows rollback to previous deployments via GitHub UI
- Provides visibility into what's currently deployed
- Enables future deployment protection if needed

### 3. Verify Workflow Permissions

Navigate to: **Settings → Actions → General → Workflow permissions**

Ensure the following setting is enabled:
- ✅ **Read and write permissions**

**Token permissions:**
- ✅ Allow GitHub Actions to create and approve pull requests (optional, not currently needed)

## How the Deploy Flow Works

### Development Workflow

1. **Create feature branch** from `main`:
   ```bash
   git checkout -b feat/add-new-feature
   ```

2. **Make changes and commit**:
   ```bash
   git commit -m "feat: add FAQ accordion component

   Co-authored-by: OpenCode Agent <agent@opencode.ai>"
   ```

3. **Push branch and create PR**:
   ```bash
   git push -u origin feat/add-new-feature
   gh pr create --title "feat: add FAQ accordion component" --body-file .github/PULL_REQUEST_TEMPLATE.md
   ```

4. **CI runs automatically**:
   - Builds the site to validate no errors
   - Uploads build artifact for potential reuse

5. **PR is reviewed and merged** (after CI passes):
   - Branch protection ensures CI passed
   - Squash or rebase merge keeps history clean

6. **On merge to main**, the deploy workflow triggers:
   - Builds the static site
   - Deploys to GitHub Pages at yellowdex.ai
   - Records deployment in `github-pages` environment

## Troubleshooting

### CI Check Not Appearing in PR

**Problem:** The "Build & Validate" status check doesn't appear as required in PRs.

**Solution:**
1. Ensure CI workflow has run at least once on a PR
2. Go to branch protection settings
3. In "Require status checks to pass before merging", search for "Build & Validate"
4. Select it from the dropdown (it only appears after running once)

### Deploy Workflow Fails with 403 Error

**Problem:** `actions/deploy-pages@v4` returns a 403 Forbidden error.

**Solution:**
1. Navigate to: **Settings → Pages**
2. Ensure **Source** is set to "GitHub Actions" (not "Deploy from a branch")
3. Verify workflow has `id-token: write` permission in `deploy.yml`

## Recommended Git Configuration

For developers working on this repository:

```bash
# Enable commit signing (required)
git config --global commit.gpgsign true
git config --global user.signingkey <YOUR_GPG_KEY_ID>

# Set default branch name
git config --global init.defaultBranch main

# Always create merge commits when pulling (optional)
git config pull.rebase false

# Use ssh instead of https for GitHub (optional)
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
