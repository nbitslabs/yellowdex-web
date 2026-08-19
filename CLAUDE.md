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

Static Astro site for the Yellowdex Chrome extension, deployed to GitHub Pages at yellowdex.ai. Public page routes are `/` (`index.astro`), `/releases`, `/privacy-policy`, `/brand-assets`, and the `/directory` address directory; machine-readable endpoints are `/llms.txt`, `/releases.md`, `/privacy-policy.md`, and `/directory/sitemap.xml`.

### Key files

- `src/pages/index.astro` — Home page (hero, features, FAQ, CTA). Content is hardcoded as JS objects (steps, features, FAQs), not in content collections.
- `src/layouts/BaseLayout.astro` — Root HTML layout with SEO meta tags, OG tags, and font imports.
- `src/styles/global.css` — Tailwind v4 theme tokens (colors, fonts) and custom component classes (`.card`, `.pill`).
- `src/lib/getLatestRelease.ts` — Fetches latest release from `nbitslabs/yellowdex-ext` GitHub repo at build time. Supports `GITHUB_TOKEN` or `PUBLIC_GITHUB_TOKEN` env var for rate limiting.
- `src/lib/getDirectory.ts` — Fetches the curated owner's public collections and up to 500 addresses each from the Yellowdex public API (`sync.yellowdex.ai/api/v1`) at build time. Results are memoized per build. Owner handle defaults to `yellowdex`, overridable via `PUBLIC_DIRECTORY_OWNER`.
- `src/components/CollectionDirectoryPage.astro` — Shared renderer for a single collection page: title, address/label/entity/network table (100 rows), other-collection links, pagination controls, and per-page SEO (`rel=prev/next`, `CollectionPage`/`BreadcrumbList` JSON-LD via BaseLayout's `head` slot).
- `src/pages/directory/` — `index.astro` lists all public collections; `[slug]/index.astro` is a collection's page 1 (canonical); `[slug]/[page].astro` is pages 2..N; `sitemap.xml.ts` is the dynamic per-page sitemap.
- `astro.config.mjs` — Astro config with Tailwind v4 via `@tailwindcss/vite`.

### Multi-surface sync

When changing or adding a page, manually update `public/sitemap.xml`, the `src/pages/llms.txt.ts` page registry, and the duplicated footer/navigation chrome. Keep `src/pages/privacy-policy.astro` and `src/pages/privacy-policy.md.ts` semantically identical.

### Upstream release projection

Release content is fetched at build time from `nbitslabs/yellowdex-ext` by `src/lib/getLatestRelease.ts`. Fetch failures return `null` or `[]` and do not fail the build. Upstream Markdown is rendered with `marked` and injected with `set:html` without a sanitizer. `deploy.yml` supplies `EXT_RELEASE_TOKEN` as `PUBLIC_GITHUB_TOKEN`; `ci.yml` does not, so release content differs between CI and production.

### Directory projection

The `/directory` pages are projected at build time from the Yellowdex public API by `src/lib/getDirectory.ts` (`getStaticPaths` in the route files). Each public collection surfaces at most 500 addresses (the API page cap), paginated 100 per page. Fetch failures return `[]` and do not fail the build — the directory index then renders an empty state and no per-collection pages are generated. Because the page set is data-driven, `/directory/sitemap.xml` is generated dynamically (and referenced from `robots.txt`) rather than hand-maintained in `public/sitemap.xml`.

### Blog

The blog uses an Astro **content collection** (`@astrojs/mdx`). Posts are MDX files in `src/content/blog/*.mdx` with frontmatter validated by the schema in `src/content.config.ts` (title, description, pubDate, category, readingTime, optional ogImage, draft). The file basename is the URL slug. Prose is authored in Markdown and rendered through `src/pages/blog/[...slug].astro` inside a Tailwind Typography (`prose`) wrapper; the styled comparison table and install CTA are components (`src/components/CompareTable.astro`, `InstallCTA.astro`) imported directly into the MDX. `src/lib/blog.ts` centralizes collection access (`getPublishedPosts` excludes drafts, sorts newest-first) and URL/date helpers.

The listing (`src/pages/blog/index.astro`), the dynamic `/blog/sitemap.xml` (referenced from `robots.txt`), and the Blog section of `src/pages/llms.txt.ts` **all derive from the collection**, so adding a post is self-contained: drop a valid `.mdx` file in `src/content/blog/` — no edits to `public/sitemap.xml`, the listing, or llms.txt required. Each post emits `BlogPosting` + `BreadcrumbList` JSON-LD; the listing emits `Blog` JSON-LD. Nav/footer chrome is still duplicated across pages (see Multi-surface sync).

### Styling

Tailwind CSS v4 with custom theme in `global.css`:
- Fonts: Sora (display), Space Grotesk (body) via Google Fonts
- Colors: `sun` (#f4c451), `amber`, `emerald` (#16a394), `ink` (#0f172a), `paper` (#fffaf2), `panel` (#f7eec7), `charcoal`
- Tailwind classes are used directly in Astro templates (no CSS modules)

### Deployment

Two GitHub Actions workflows handle CI and deployment:

- **ci.yml** — Validates builds on pushes to `main` and on pull requests. It uploads a build artifact, but deployment does not consume it. The repository contains `.github/BRANCH_PROTECTION.md` setup instructions only; remote branch-protection enforcement is unverified from the tree.

- **deploy.yml** — Independently deploys to GitHub Pages at yellowdex.ai on push to `main`, nightly at 5 AM UTC, manual dispatch, or `ext-release-published` repository dispatch from the extension repo. It rebuilds from scratch and does not consume CI's artifact.

On pushes to `main`, CI and deployment trigger independently; CI does not gate deployment. No versioning or release tagging is used.

See `.github/BRANCH_PROTECTION.md` for setup instructions.

### Comparison slider

The home-page preview uses the `data-comparison-slider` control in `src/pages/index.astro`. The `#eth-labeler-fontawesome` detection block still targets non-existent `overlay-*` IDs; it is dead code and should be removed rather than used as an extension integration point.

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

Do not require a specific AI-tool co-author. If a commit needs attribution, name the actual contributing tool, such as Claude Code or Codex.

## Pull Request Guidelines

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
