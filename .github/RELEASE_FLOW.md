# Release Flow Guide

This document describes the automated release flow for the Yellowdex landing page, including how versions are determined, how releases are created, and how deployments work.

## Overview

The yellowdex-web repository uses **trunk-based development** with **automated semantic versioning** for releases to GitHub Pages.

### Key Principles

1. **Main branch is always deployable** - All merges to main trigger deployment
2. **Conventional commits drive versioning** - Commit message format determines version bumps
3. **Automated releases** - No manual version bumping or changelog maintenance
4. **Quality gates** - CI must pass before PRs can merge
5. **Transparent history** - All releases tracked with tags and GitHub Releases

## Workflow Architecture

```
Feature Branch → PR Created → CI Runs → Review → Merge to Main
                                                        ↓
                                          Release Workflow Triggers
                                                        ↓
                                    Analyze Commits → Bump Version
                                                        ↓
                                    Create Tag → GitHub Release
                                                        ↓
                                          Deploy Workflow Triggers
                                                        ↓
                                      Build Site → Deploy to Pages
```

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** All pushes and PRs

**Purpose:** Validate that the site builds successfully

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Build site
5. Upload build artifacts (retained for 1 day)

**Exit Code:** Non-zero exit code blocks PR merge when branch protection is enabled

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:** Pushes to main branch (excludes release version bump commits to prevent recursion)

**Purpose:** Automatically create versioned releases based on conventional commits

**Steps:**
1. Checkout repository with full history
2. Get current version from package.json and latest git tag
3. Analyze commits since last release to determine bump type:
   - `feat:` commits → **minor** bump (0.X.0)
   - `fix:`, `chore:`, `docs:`, etc. → **patch** bump (0.0.X)
   - Commits with `!` or `BREAKING CHANGE:` → **major** bump (X.0.0)
4. Calculate new version number
5. Update package.json with new version
6. Generate release notes from PR titles and commits
7. Commit version bump to main
8. Create git tag (e.g., `v1.2.3`)
9. Create GitHub Release with auto-generated notes

**Manual Triggering:** Can be triggered manually via Actions UI with custom release type selection

**Permissions Required:**
- `contents: write` - Create tags, releases, and commit version bumps
- `pull-requests: read` - Read PR titles for release notes

### 3. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to main branch
- Repository dispatch event (`ext-release-published`) from yellowdex-ext repo
- Manual workflow dispatch
- Scheduled (daily at 5 AM UTC)

**Purpose:** Deploy the static site to GitHub Pages

**Steps:**
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Configure GitHub Pages
5. Build site (fetches latest extension release data at build time)
6. Upload Pages artifact
7. Deploy to GitHub Pages (separate job with environment protection)

**Environment:** Deploys to `github-pages` environment for deployment tracking

**Permissions Required:**
- `contents: read` - Read repository contents
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - OIDC token for deployment verification

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

**Format:** `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

- **MAJOR** - Breaking changes, major redesigns, incompatible API changes
- **MINOR** - New features, additions, backwards-compatible changes
- **PATCH** - Bug fixes, small tweaks, refactoring, documentation

### Version Bump Rules

The release workflow automatically determines the version bump based on **conventional commit messages**:

| Commit Type | Example | Bump Type | Version Change |
|-------------|---------|-----------|----------------|
| `feat:` | `feat: add FAQ section` | Minor | 1.0.0 → 1.1.0 |
| `fix:` | `fix: resolve mobile layout` | Patch | 1.0.0 → 1.0.1 |
| `chore:` | `chore: update dependencies` | Patch | 1.0.0 → 1.0.1 |
| `docs:` | `docs: update README` | Patch | 1.0.0 → 1.0.1 |
| `feat!:` | `feat!: redesign landing page` | Major | 1.0.0 → 2.0.0 |
| With `BREAKING CHANGE:` footer | (any type with breaking change) | Major | 1.0.0 → 2.0.0 |

**Important:** Only commits merged to main since the last release are analyzed. Squash merging is recommended to keep a clean commit history.

## Development Workflow

### Creating a Feature

1. **Create a feature branch from main:**
   ```bash
   git checkout main
   git pull
   git checkout -b feat/add-testimonials-section
   ```

2. **Make changes and commit using conventional format:**
   ```bash
   git add src/pages/index.astro
   git commit -m "feat: add testimonials section with user quotes

   Co-authored-by: OpenCode Agent <agent@opencode.ai>"
   ```

3. **Push branch and create PR:**
   ```bash
   git push -u origin feat/add-testimonials-section
   gh pr create --title "feat: add testimonials section" --body-file .github/PULL_REQUEST_TEMPLATE.md
   ```

4. **Wait for CI to pass:**
   - CI workflow runs automatically on PR creation
   - "Build & Validate" check must pass before merge
   - Fix any build errors and push fixes

5. **Merge PR (after review and CI pass):**
   - Use "Squash and merge" to keep history clean
   - Ensure final commit message follows conventional format
   - Delete feature branch after merge

### After Merge to Main

**Automated sequence:**

1. **Release workflow runs:**
   - Analyzes commits since last release
   - Determines this is a `feat:` commit → minor bump
   - Updates package.json: `0.1.0` → `0.2.0`
   - Commits version bump: `chore(release): bump version to 0.2.0`
   - Creates git tag: `v0.2.0`
   - Creates GitHub Release with auto-generated notes

2. **Deploy workflow runs:**
   - Builds static site
   - Deploys to yellowdex.ai
   - Records deployment in `github-pages` environment

**Timeline:** Typically completes within 2-5 minutes of merge.

## Conventional Commits Reference

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat:** New feature for the user (triggers minor version bump)
- **fix:** Bug fix for the user (triggers patch version bump)
- **chore:** Changes that don't affect the site (dependencies, config, etc.)
- **docs:** Documentation only changes
- **style:** Code style changes (formatting, missing semi-colons, etc.)
- **refactor:** Code refactoring without functional changes
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **ci:** CI/CD pipeline changes

### Breaking Changes

Add `!` after the type or include `BREAKING CHANGE:` footer to trigger a major version bump:

```bash
# Option 1: Exclamation mark
git commit -m "feat!: redesign entire landing page layout"

# Option 2: Footer
git commit -m "feat: change API response format

BREAKING CHANGE: Extension detection now uses data-yellowdex attribute instead of style element ID"
```

### Scope (Optional)

Add a scope to provide additional context:

```bash
git commit -m "feat(hero): add animated gradient background"
git commit -m "fix(faq): resolve accordion animation stutter"
git commit -m "chore(deps): upgrade Astro to v5.17"
```

## Release Notes

Release notes are **auto-generated** from PR titles and commit messages merged since the last release.

### Example Release Notes

```markdown
## What's Changed

### Features
* feat: add testimonials section by @trishtzy in #42
* feat: add live demo video by @trishtzy in #43

### Bug Fixes
* fix: resolve mobile navigation overflow by @trishtzy in #44

### Maintenance
* chore: upgrade Astro and Tailwind dependencies by @trishtzy in #45

**Full Changelog**: https://github.com/nbitslabs/yellowdex-web/compare/v0.1.0...v0.2.0
```

**Best Practices:**
- Write clear, user-facing PR titles (they become release notes)
- Use conventional commit format in PR titles
- Keep PR titles concise but descriptive
- Avoid technical jargon in PR titles when possible

## Manual Release

To create a release with a specific version bump (bypassing automatic analysis):

1. Navigate to: **Actions → Release → Run workflow**
2. Select branch: `main`
3. Choose release type:
   - `major` - 1.0.0 → 2.0.0
   - `minor` - 1.0.0 → 1.1.0
   - `patch` - 1.0.0 → 1.0.1
4. Click **Run workflow**

**Use cases for manual releases:**
- Emergency hotfix that needs immediate release
- Force a specific version bump regardless of commit messages
- Create initial release (v0.1.0 → v1.0.0 for first stable release)

## Deployment Tracking

All deployments are tracked in the **github-pages** environment:

**View deployment history:**
1. Navigate to: **Code → Environments → github-pages**
2. See all deployments with timestamps, commits, and URLs
3. Click "View deployment" to see the live site at that version

**Rollback to previous version:**
1. Find the deployment you want to rollback to
2. Click "Re-run" on that deployment
3. Or manually trigger deploy workflow with an older commit SHA

## Monitoring & Troubleshooting

### Check Workflow Status

**Via GitHub UI:**
- Navigate to: **Actions** tab
- Filter by workflow (CI, Release, Deploy)
- Click on a run to see detailed logs

**Via GitHub CLI:**
```bash
# List recent workflow runs
gh run list --workflow=ci.yml
gh run list --workflow=release.yml
gh run list --workflow=deploy.yml

# View workflow run details
gh run view <run-id>

# Watch a running workflow
gh run watch <run-id>
```

### Common Issues

#### CI Fails with Build Error

**Problem:** `pnpm build` exits with non-zero code

**Solution:**
1. Run `pnpm build` locally to reproduce the error
2. Fix the build error in your branch
3. Push fix and wait for CI to re-run
4. Ensure build passes before merging

#### Release Workflow Doesn't Create Release

**Problem:** Merge to main doesn't trigger release workflow

**Solution:**
1. Check workflow logs in Actions tab
2. Verify the condition: `!startsWith(github.event.head_commit.message, 'chore(release):')`
3. Ensure commits have proper conventional format
4. Manually trigger release workflow if needed

#### Deploy Fails with 403 Error

**Problem:** `actions/deploy-pages@v4` returns 403 Forbidden

**Solution:**
1. Navigate to: **Settings → Pages**
2. Ensure **Source** is set to "GitHub Actions" (not "Deploy from a branch")
3. Verify `id-token: write` permission in deploy.yml
4. Check that GitHub Pages is enabled for the repository

#### Version Bump Is Wrong

**Problem:** Release created with unexpected version number

**Solution:**
1. Check commit messages merged since last release
2. Verify conventional commit format is correct
3. Remember: `feat:` = minor, `fix:` = patch, `!` or `BREAKING CHANGE:` = major
4. Delete incorrect tag and release if needed, then manually trigger with correct type

### Getting Help

- Check `.github/BRANCH_PROTECTION.md` for setup instructions
- Review workflow files for configuration details
- Check GitHub Actions logs for error messages
- Consult [GitHub Actions Documentation](https://docs.github.com/actions)

## CI/CD Health Dashboard

**Key Metrics to Monitor:**

- **CI Pass Rate:** Should be >95% (indicates stable codebase)
- **Average CI Duration:** Should be <3 minutes (fast feedback loop)
- **Deploy Success Rate:** Should be 100% (if CI passes, deploy should succeed)
- **Release Cadence:** Depends on team velocity (weekly releases are typical)

**Access metrics:**
- Navigate to: **Insights → Actions** for workflow analytics
- Use GitHub API or `gh` CLI for custom reporting

## Future Improvements

Potential enhancements to consider:

- [ ] Add Lighthouse CI for performance/accessibility scoring
- [ ] Add visual regression testing (Percy, Chromatic)
- [ ] Add PR preview deployments (Netlify Deploy Previews or Cloudflare Pages)
- [ ] Add automatic CHANGELOG.md updates (currently manual)
- [ ] Add commit linting (commitlint) to enforce conventional commits
- [ ] Add semantic-release or release-please for more advanced release management
- [ ] Add Slack/Discord notifications for releases and deployments
- [ ] Add rollback automation via GitHub Issues or Slack commands
- [ ] Add deployment approvals for production (if multiple environments)

## Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [GitHub Environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
