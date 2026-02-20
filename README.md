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
