import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

/** Published posts (drafts excluded), newest first. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Site-relative URL for a post, e.g. /blog/<slug>/ */
export function postPath(post: BlogPost): string {
  return `/blog/${post.id}/`;
}

/** ISO date (YYYY-MM-DD) for <time datetime>, JSON-LD, and sitemap lastmod. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Human-readable date, e.g. "August 19, 2026". */
export function displayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
