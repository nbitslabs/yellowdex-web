import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, postPath } from "../../lib/blog";

const SITE = "https://yellowdex.ai";

// RSS 2.0 feed for the blog, built from the `blog` content collection and
// advertised via <link rel="alternate"> in the blog pages' <head>. Adding an
// .mdx post updates the feed automatically.
export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: "The Yellowdex blog",
    description:
      "Notes on labeling crypto addresses, on-chain context, and how Yellowdex fits alongside blockchain intelligence tools.",
    site: context.site ?? SITE,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postPath(post),
      categories: [post.data.category],
    })),
  });
}
