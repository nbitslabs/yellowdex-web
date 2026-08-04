import type { APIRoute } from "astro";
import { getDirectory, collectionPath } from "../../lib/getDirectory";

const SITE = "https://yellowdex.ai";

// Dynamic sitemap for the data-driven directory: one entry per collection page
// (page 1..N). Referenced from robots.txt so crawlers discover every page even
// though the routes are generated from live API data at build time.
export const GET: APIRoute = async () => {
  const entries = await getDirectory();

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${SITE}/directory/` },
  ];

  for (const entry of entries) {
    const lastmod = entry.collection.lastUpdatedAt
      ? entry.collection.lastUpdatedAt.slice(0, 10)
      : undefined;
    for (let page = 1; page <= entry.totalPages; page++) {
      urls.push({ loc: `${SITE}${collectionPath(entry.collection.slug, page)}`, lastmod });
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>${
        u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""
      }\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
