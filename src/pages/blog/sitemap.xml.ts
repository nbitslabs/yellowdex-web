import type { APIRoute } from "astro";
import { getPublishedPosts, postPath, isoDate } from "../../lib/blog";

const SITE = "https://yellowdex.ai";

// Dynamic sitemap for the data-driven blog: the index plus one entry per
// published post in the `blog` content collection. Referenced from robots.txt
// so every post is discovered automatically — adding an .mdx file to
// src/content/blog/ is enough, no hand-editing of public/sitemap.xml required.
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();

  const urls: { loc: string; lastmod?: string }[] = [{ loc: `${SITE}/blog/` }];
  for (const post of posts) {
    urls.push({ loc: `${SITE}${postPath(post)}`, lastmod: isoDate(post.data.pubDate) });
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
