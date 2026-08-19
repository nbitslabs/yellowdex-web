import type { APIRoute } from "astro";
import { getAllReleases } from "../lib/getLatestRelease";
import { getPublishedPosts, postPath } from "../lib/blog";

export const GET: APIRoute = async () => {
  const releases = await getAllReleases();
  const posts = await getPublishedPosts();

  const blogPostLinks = posts
    .map((p) => `  - [${p.data.title}](https://yellowdex.ai${postPath(p)})`)
    .join("\n");

  const releaseSection = releases.length > 0
    ? `## Releases

${releases.map((r) => `### ${r.name} (${r.tagName})${r.publishedOn ? ` — ${r.publishedOn}` : ""}

${r.body}`).join("\n\n")}
`
    : `## Releases

No releases published yet.
`;

  const content = `# Yellowdex

> Yellowdex is a Chrome extension that labels every Ethereum address you see while browsing — on explorers, wallets, dashboards, marketplaces, and forums. Save labels to collections and share them with your team.

## What Yellowdex does

Yellowdex floats an overlay beside any Ethereum address you encounter on the web. You can assign an entity name, add a label, apply color-coded tags, and save everything to a collection. Labels are local-first: you control what stays private and what gets shared.

## Key features

- **Works wherever you browse** — Detects addresses automatically on any page. Supports Etherscan, Twitter/X, Discord, docs sites, and more.
- **Smart search with filters** — Prefix syntax: \`a:\` for addresses, \`l:\` for labels, \`e:\` for entities. Filter by current page or labeled status.
- **Custom color-coded tags** — Mark addresses however you choose. Pre-built risk categories coming soon.
- **Sync across devices** — Connect your wallet to sync labels across browsers, or keep everything local.
- **Collections & sharing** — Organize labels into collections and share them via read-only links. Recipients import the entire collection with one click.

## How it works

1. Spot an address — Yellowdex floats beside any address on explorers, wallets, dashboards, and marketplaces.
2. Label it in a tap — Assign an entity, add a label and color-coded tags. Labels appear everywhere you browse.
3. Save to a collection — Organize labels into collections (like a contact list) and share them with teammates or the public.

## Install

Available on the Chrome Web Store: https://chromewebstore.google.com/detail/lapdeiobkgdfjfcdddjbmmhooicppmha

${releaseSection}
## API

Yellowdex exposes a public HTTP API at https://sync.yellowdex.ai/api/v1 for authentication, collections, labels, sync, and sharing. Authenticated endpoints use a JWT bearer token obtained via wallet-signature login (POST /auth/login).

- [API Reference (Markdown)](https://yellowdex.ai/api-docs.md) — full endpoint and model reference for agents
- [OpenAPI spec (Swagger 2.0 JSON)](https://sync.yellowdex.ai/api/v1/openapi.json)
- [Interactive API docs](https://yellowdex.ai/api-docs/)

## Pages

- [Home](https://yellowdex.ai/)
- [Blog](https://yellowdex.ai/blog/) — notes on address labeling and on-chain context
${blogPostLinks}
- [Address Directory](https://yellowdex.ai/directory/) — public collections of labeled crypto addresses
- [API Docs](https://yellowdex.ai/api-docs/) — [Markdown](https://yellowdex.ai/api-docs.md)
- [Brand Assets](https://yellowdex.ai/brand-assets/)
- [Release Notes](https://yellowdex.ai/releases/) — [Markdown](https://yellowdex.ai/releases.md)
- [Privacy Policy](https://yellowdex.ai/privacy-policy/) — [Markdown](https://yellowdex.ai/privacy-policy.md)

## Contact

support@yellowdex.ai
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
