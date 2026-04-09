# yellowdex-web

Landing page for Yellowdex (Astro + Tailwind). Yellowdex is a Chrome extension that lets you label crypto addresses anywhere, organize them into collections, and share with others.

## Getting started

```sh
pnpm install
pnpm dev
```

## Commands

| Command        | Action                                   |
| :------------- | :--------------------------------------- |
| `pnpm dev`     | Start local dev server (localhost:4321)  |
| `pnpm build`   | Build for production to `dist/`          |
| `pnpm preview` | Preview the built site locally           |

## Notes

- The "Install on Chrome" CTA currently uses a placeholder link until the Chrome Web Store listing is live.
- Tailwind v4 is set up via `@tailwindcss/vite` with theme tokens defined in `src/styles/global.css`.
- Canonical URL, `robots.txt`, and `sitemap.xml` assume `https://yellowdex.ai`. Update `astro.config.mjs` and `public/robots.txt`/`public/sitemap.xml` if you deploy on a different domain.
- Landing page pulls the latest release notes from `nbitslabs/yellowdex-ext` at build time; a GitHub Pages deploy workflow triggers on `push`, nightly schedule, manual dispatch, and `repository_dispatch` (`ext-release-published`).
- A dedicated `/releases/` page lists all past extension releases. It currently fetches a single page of up to 100 releases from the GitHub API (`per_page=100`). **TODO:** Add pagination support to handle >100 releases once the extension has enough history.
