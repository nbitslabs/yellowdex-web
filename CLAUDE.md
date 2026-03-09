# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server at localhost:4321
pnpm build      # Build static site to dist/
pnpm preview    # Preview production build locally
```

Package manager is **pnpm** (v9). Node 20 required. A Nix flake is available for consistent dev environments.

No test suite or linter is configured. Use `pnpm build` to validate changes.

## Architecture

Single-page static Astro site for the Yellowdex Chrome extension landing page, deployed to GitHub Pages at yellowdex.ai.

### Key files

- `src/pages/index.astro` — The entire landing page (hero, features, FAQ, CTA). Content is hardcoded as JS objects (steps, features, FAQs), not in content collections.
- `src/layouts/BaseLayout.astro` — Root HTML layout with SEO meta tags, OG tags, and font imports.
- `src/styles/global.css` — Tailwind v4 theme tokens (colors, fonts) and custom component classes (`.card`, `.pill`).
- `src/lib/getLatestRelease.ts` — Fetches latest release from `nbitslabs/yellowdex-ext` GitHub repo at build time. Supports `GITHUB_TOKEN` or `PUBLIC_GITHUB_TOKEN` env var for rate limiting.
- `astro.config.mjs` — Astro config with Tailwind v4 via `@tailwindcss/vite`.

### Styling

Tailwind CSS v4 with custom theme in `global.css`:
- Fonts: Sora (display), Space Grotesk (body) via Google Fonts
- Colors: `sun` (#f8d23c), `amber`, `emerald` (#16a394), `ink` (#0f172a), `paper` (#fffaf2), `charcoal`
- Tailwind classes are used directly in Astro templates (no CSS modules)

### Deployment

Two GitHub Actions workflows handle CI and deployment:

- **ci.yml** — Validates builds on every push and PR to main. Uploads build artifacts for potential reuse. This check must pass before PRs can be merged (enforced via branch protection).

- **deploy.yml** — Deploys to GitHub Pages at yellowdex.ai on push to main, nightly at 5 AM UTC, manual dispatch, or `ext-release-published` repository dispatch from the extension repo.

Merging a PR to main triggers CI validation and then automatic deployment. No versioning or release tagging is used.

See `.github/BRANCH_PROTECTION.md` for setup instructions.

### Extension detection

The landing page detects the Yellowdex extension by checking for `#eth-labeler-fontawesome` (a style element the extension injects). When detected, the overlay preview switches from a static mockup to a live interactive view.

## Git Commit Guidelines

### GPG Signing
All commits must be GPG signed. Configure Git to sign commits by default:
```bash
git config --global commit.gpgsign true
git config --global user.signingkey <YOUR_KEY_ID>
```

### Commit Message Format
Use the format: `<domain>: <action>`

Examples:
- `content: update hero tagline and feature descriptions`
- `fix: resolve overlay badge overlap at half-width`
- `feat: add extension detection for live overlay preview`
- `ci: add build check on all branches and PRs`
- `style: update theme colors in global.css`

### Commit Best Practices
- Make small, logical commits
- Each commit should represent a single, coherent change
- Avoid bundling unrelated changes in one commit
- Write descriptive commit messages explaining the "why", not just the "what"

### Co-author Attribution
**Mandatory**: All commits where OpenCode contributes code, documentation, or significant changes must include OpenCode as co-author:

```bash
git commit -m "feat: add new feature

Co-authored-by: OpenCode Agent <agent@opencode.ai>"
```

This preserves your GPG signature as primary author while acknowledging AI contributions in GitHub's contributor tracking.

## Pull Request Guidelines

### PR Title Format
PR titles must use conventional commits format with a prefix:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks, dependencies, tooling
- `docs:` - Documentation changes
- `refactor:` - Code refactoring without functional changes
- `test:` - Adding or updating tests
- `perf:` - Performance improvements
- `security:` - Security fixes

**Important**: PR titles are user-facing and included in release notes. The description after the prefix must be user-facing ready.

Examples:
- `feat: add FAQ section with accordion component`
- `fix: resolve overlay badge overlap at narrow viewports`
- `chore: upgrade Astro and Tailwind dependencies`

### PR Description
All PRs must follow the template in `.github/PULL_REQUEST_TEMPLATE.md`. Include:
1. Summary of changes
2. Motivation/context
3. Testing performed
4. Breaking changes (if any)

### Creating PRs via GitHub CLI
```bash
gh pr create --title "feat: add collections sharing flow to landing page" --body-file .github/PULL_REQUEST_TEMPLATE.md
```