import { OGImageRoute } from "astro-og-canvas";
import { getPublishedPosts, displayDate } from "../../../lib/blog";
import { ogImageOptions } from "../../../lib/ogImage";

// Build-time OG images, one PNG per blog post at /blog/og/<slug>.png.
// Derived from the same collection as the listing/sitemap/llms.txt, so adding
// a post automatically gets a social image — no per-post asset to maintain.
const posts = await getPublishedPosts();

const pages = Object.fromEntries(
  posts.map((post) => [
    post.id,
    {
      title: post.data.title,
      description: `${post.data.category} · ${displayDate(post.data.pubDate)} · ${post.data.readingTime}`,
    },
  ]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getSlug: (path) => path,
  getImageOptions: (_path, page) => ogImageOptions(page.title, page.description),
});
